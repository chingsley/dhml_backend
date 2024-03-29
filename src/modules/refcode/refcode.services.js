/* eslint-disable indent */
import { Op } from 'sequelize';
import AppService from '../app/app.service';
import db from '../../database/models';
import codeFactory from './refcode.factory';
import { stateCodes } from '../../shared/constants/statecodes.constants';
import refcodeScripts from '../../database/scripts/refcode.scripts';
import { refcodeSearchableFields } from '../../shared/attributes/refcode.attributes';
import { CODE_STATUS } from '../../shared/constants/lists.constants';
import { months } from '../../utils/timers';
import Cloudinary from '../../utils/Cloudinary';
import { CLAIMS_SUPPORT_DOCS } from '../../shared/constants/strings.constants';

export default class RefcodeService extends AppService {
  constructor({ body, files, query, params, user: operator }) {
    super({ body, files, query, params, operator });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
    this.ReferalCodeModel = db.ReferalCode;
    this.operator = operator;
    this.refcodeScripts = refcodeScripts;
  }
  async createRequestForReferalCodeSVC() {
    const { enrolleeIdNo, receivingHcpId, specialtyId } = this.body;
    // await this.validateId('HealthCareProvider', referringHcpId);
    const referringHcp = await this.$getReferringHcpIdForCodeRequest(this.operator, this.body);
    const receivingHcp = await this.validateId('HealthCareProvider', receivingHcpId);
    await receivingHcp.validateSpecialtyId(specialtyId);
    const enrollee = await this.findOneRecord({
      where: { enrolleeIdNo },
      modelName: 'Enrollee',
      errorIfNotFound: 'Invalid enrollee Id No. Record not found',
    });
    const data = await db.ReferalCode.createAndReload({
      ...this.body,
      enrolleeId: enrollee.id,
      requestState: this.operator.userLocation,
      requestedBy: this.operator.subjectId,
      referringHcpId: referringHcp.id,
    });
    this.record(`Submitted a request for referal code (refcodeId: ${data.id})`);
    return data;
  }

  getOneRefcodeSv() {
    const { referalCode: code, refcodeId: id } = this.query;
    const field = id ? 'id' : 'code';
    const value = id || code;

    return this.findOneRecord({
      modelName: 'ReferalCode',
      where: { [field]: value },
      include: [
        ...['referringHcp', 'receivingHcp'].map((item) => ({
          model: db.HealthCareProvider,
          as: item,
          attributes: ['id', 'name', 'code'],
        })),
        {
          model: db.Specialty,
          as: 'specialty',
          attributes: ['id', 'name'],
        },
        ...['declinedBy', 'flaggedBy', 'approvedBy', 'claimsDeclinedBy'].map((item) => ({
          model: db.User,
          as: item,
          attributes: ['id', 'username'],
          include: {
            model: db.Staff,
            as: 'staffInfo',
            attributes: ['id', 'firstName', 'surname', 'staffIdNo'],
          },
        })),
        {
          model: db.Enrollee,
          as: 'enrollee',
          include: [
            {
              model: db.ReferalCode,
              as: 'referalCodes',
              where: { [field]: { [Op.not]: value } },
              order: [['createdAt', 'DESC']],
              limit: 5,
            },
            {
              model: db.HealthCareProvider,
              as: 'hcp',
              attributes: ['id', 'name', 'code'],
            },
          ],
        },
        {
          model: db.Claim,
          as: 'claims',
          order: [['originalClaimId', 'DESC']],
        },
        {
          model: db.OriginalClaim,
          as: 'originalClaims',
          order: [['id', 'DESC']],
        },
      ],
      errorIfNotFound: `No code request found for ${field}: ${value}`,
    });
  }

  async updateCodeRequestDetailsSV() {
    const { refcodeId } = this.params;
    const { receivingHcpId: newReceivingHcpId, specialtyId: newSpecialtyId } = this.body;

    const refcode = await db.ReferalCode.findById(refcodeId);
    this.authorizeRefcodeRecevingHcp(this.operator, refcode);
    // refcode.rejectIfCodeIsExpired();
    // refcode.rejectIfCodeIsClaimed();
    // refcode.rejectIfCodeIsDeclined();
    // refcode.rejectIfCodeIsApproved();
    refcode.disallowIf(['expired', 'claimed', 'declined', 'approved']);

    if (newReceivingHcpId || newSpecialtyId) {
      const specialtyId = newSpecialtyId || refcode.specialtyId;
      const receivingHcp = newReceivingHcpId
        ? await this.validateId('HealthCareProvider', newReceivingHcpId)
        : refcode.receivingHcp;
      await receivingHcp.validateSpecialtyId(specialtyId);
    }
    this.record(`Updated the details of the code request (refcodeId: ${refcodeId})`);
    return refcode.updateAndReload(this.body);
  }

  async updateRefcodeStatus() {
    const { refcodeId } = this.params;
    const operatorId = this.operator.id;
    const { status, stateOfGeneration, flagReason, declineReason, claimsDeclineReason } =
      this.body;

    const refcode = await db.ReferalCode.findById(refcodeId);
    // refcode.rejectIfCodeIsExpired();
    // refcode.rejectIfCodeIsClaimed();
    // refcode.rejectIfCodeIsDeclined();
    refcode.disallowIf(['expired', 'claimed', 'declined']);

    let updates = {
      dateDeclined: null,
      declinedById: null,
      dateFlagged: null,
      flaggedById: null,
      dateApproved: null,
      approvedById: null,
      flagReason: null,
      declineReason: null,
      claimsDeclineById: null,
      claimsDeclineReason: null,
      claimsDeclineDate: null,
    };

    if (status === CODE_STATUS.DECLINED) {
      // we can decline an approved code as long it has not been claimed..
      //  - but without deleting the code, or changing the expiration date
      refcode.disallowIf(['expired', 'claimed', 'declined']);
      updates = {
        ...updates,
        dateDeclined: new Date(),
        declinedById: operatorId,
        declineReason,
      };
    } else if (status === CODE_STATUS.FLAGGED) {
      // we can flag an approved code as long it has not been claimed..
      //  - but without deleting the code, or changing the expiration date
      refcode.disallowIf(['expired', 'claimed', 'declined']);
      updates = {
        ...updates,
        dateFlagged: new Date(),
        flaggedById: operatorId,
        flagReason,
      };
    } else if (status === CODE_STATUS.APPROVED) {
      refcode.disallowIf(['expired', 'claimed', 'declined', 'approved']);
      // if request is approved (i.e code generated), then flagged, then approved again, then:
      // ---- we do not generate a new code, but use the existing code
      // ---- we do not generate a new expiresAt date, but use the existing date
      // ---- we  set the approvedById to the id of the  new approver
      const code =
        refcode.code ||
        (await this.generateReferalCode({
          enrolleeServiceStatus: refcode.enrollee.serviceStatus,
          stateCode: stateCodes[stateOfGeneration.toLowerCase()],
          specialty: refcode.specialty,
        }));
      const expiresAt = refcode.expiresAt || months.setFuture(3);
      updates = {
        ...updates,
        dateApproved: new Date(),
        approvedById: operatorId,
        code,
        codeGeneratedAt: refcode.codeGeneratedAt || new Date(),
        specialtyCode: refcode.specialty.code,
        expiresAt,
        stateOfGeneration: refcode.stateOfGeneration || stateOfGeneration,
      };
    } else if (status === CODE_STATUS.CLAIMS_DECLINED) {
      // we can decline the claims associated with a refcode
      // - will fail if the refcode has no claims yet or the claims...
      // ... have already been declined
      refcode.disallowIf(['claims-not-found', 'declined-claims']);
      updates = {
        // we will not ...updates because we don't want to reset
        //  other status values of the refcode to null, they're not mutually exclusive
        claimsDeclineDate: new Date(),
        claimsDeclineById: operatorId,
        claimsDeclineReason,
      };
    } else if (status === CODE_STATUS.CLAIMS_NOT_DECLINED) {
      // we can undo claims decline
      updates = {
        // we will not ...updates because we don't want to reset
        //  other status values of the refcode to null, they're not mutually exclusive
        claimsDeclineDate: null,
        claimsDeclineById: null,
        claimsDeclineReason: null,
      };
    }
    this.record(`${status} code request (refcodeId: ${refcodeId})`);
    return refcode.updateAndReload(updates);
  }

  async verifyClaimsSVC() {
    const { refcodeId } = this.params;
    const { remarks } = this.body;
    const refcode = await db.ReferalCode.findById(refcodeId);
    refcode.rejectIfNotApproved();
    refcode.rejectIfClaimsNotFound();
    refcode.rejectIfCodeIsClaimed('Claims have already been verified');
    const data = await refcode.updateAndReload({
      claimsVerifiedOn: new Date(),
      claimsVerifierId: this.operator.id,
      remarksOnClaims: remarks,
    });
    this.record(`Verified the claims for code request (refcodeId: ${refcodeId})`);
    return data;
  }

  async uploadClaimsSupportingDocSVC() {
    const { image } = this.files;
    const { refcodeId } = this.params;
    const cloudSubFolder = CLAIMS_SUPPORT_DOCS;
    const refcode = await db.ReferalCode.findById(refcodeId);
    this.authorizeRefcodeRecevingHcp(this.operator, refcode, {
      withError: 'Invalid refcodeId, belongs to a different Receiving Hcp',
    });
    const uploadedImgUrl = await Cloudinary.uploadImage(image, cloudSubFolder);
    await refcode.updateAndReload({ claimsSupportingDocument: uploadedImgUrl });
    this.record(`Uploaded claims-supporting documents (refcodeId: ${refcodeId})`);
    return refcode;
  }

  async deleteClaimsSupportDocSVC() {
    const { refcodeId } = this.params;
    const refcode = await db.ReferalCode.findById(refcodeId);
    this.authorizeRefcodeRecevingHcp(this.operator, refcode, {
      withError: 'Invalid refcodeId, belongs to a different Receiving Hcp',
    });
    await refcode.updateAndReload({ claimsSupportingDocument: null });
    this.record(`Deleted claims-supporting documents (refcodeId: ${refcodeId})`);
    return refcode;
  }

  async handleCodeDelete() {
    const { refcodeId } = this.params;

    const refcode = await db.ReferalCode.findById(refcodeId);
    refcode.disallowIf(['expired', 'claimed', 'declined', 'approved']);

    await refcode.destroy();
    this.record(`Deleted code request (refcodeId: ${refcodeId})`);
    return true;
  }

  async getRefcodes() {
    const { fetchAllRefcodes } = this.refcodeScripts;
    const nonPaginatedRows = await this.executeQuery(fetchAllRefcodes, {
      ...this.query,
      pageSize: undefined,
      page: undefined,
      operator: this.operator,
    });
    const count = nonPaginatedRows.length;
    const rows = await this.executeQuery(fetchAllRefcodes, {
      ...this.query,
      operator: this.operator,
    });
    return { count, rows };
  }

  async fetchEnrolleeCodeHistory() {
    const { enrolleeIdNo } = this.query;
    const enrollee = await this.findOneRecord({
      modelName: 'Enrollee',
      where: { enrolleeIdNo },
      errorIfNotFound: `no Enrollee matches the ID No. ${enrolleeIdNo}`,
    });
    const refcodeHistory = await db.ReferalCode.findAndCountAll({
      where: {
        enrolleeId: enrollee.id,
        ...this.searchRecordsBy(refcodeSearchableFields),
      },
      ...this.paginate(),
      include: [
        {
          model: db.HealthCareProvider,
          as: 'referringHcp',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: db.HealthCareProvider,
          as: 'receivingHcp',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: db.User,
          as: 'approvedBy',
          attributes: ['id', 'staffId', 'username'],
          include: {
            model: db.Staff,
            as: 'staffInfo',
            attributes: ['id', 'staffIdNo', 'email', 'surname', 'firstName'],
          },
        },
      ],
    });
    refcodeHistory.enrollee = enrollee;
    return refcodeHistory;
  }

  async $getReferringHcpIdForCodeRequest(operator, reqBody) {
    const { referringHcpId } = reqBody;
    const { userType } = operator;
    let referringHcp;
    if (userType.toLowerCase() === 'hcp') {
      referringHcp = operator;
    } else {
      referringHcp = await this.validateId('HealthCareProvider', referringHcpId);
    }
    return referringHcp;
  }
}

Object.assign(RefcodeService.prototype, codeFactory);
