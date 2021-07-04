/* eslint-disable indent */
import { Op } from 'sequelize';
import AppService from '../app/app.service';
import db from '../../database/models';
import codeFactory from './refcode.factory';
import { stateCodes } from '../../shared/constants/statecodes.constants';
import { fetchAllRefcodes } from '../../database/scripts/refcode.scripts';
import { refcodeSearchableFields } from '../../shared/attributes/refcode.attributes';
import { CODE_STATUS } from '../../shared/constants/lists.constants';
import { months } from '../../utils/timers';

export default class RefcodeService extends AppService {
  constructor({ body, files, query, params, user: operator }) {
    super({ body, files, query, params });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
    this.ReferalCodeModel = db.ReferalCode;
    this.operator = operator;
  }
  async createRequestForReferalCodeSVC(payload) {
    const { enrolleeIdNo, referringHcpId, receivingHcpId, specialtyId } =
      payload;
    await this.validateId('HealthCareProvider', referringHcpId);
    const receivingHcp = await this.validateId(
      'HealthCareProvider',
      receivingHcpId
    );
    await receivingHcp.validateSpecialtyId(specialtyId);
    const enrollee = await this.findOneRecord({
      where: { enrolleeIdNo },
      modelName: 'Enrollee',
      errorIfNotFound: 'Invalid enrollee Id No. Record not found',
    });
    return db.ReferalCode.createAndReload({
      ...this.body,
      enrolleeId: enrollee.id,
      requestState: this.operator.userLocation,
      requestedBy: this.operator.subjectId,
    });
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
        ...['declinedBy', 'flaggedBy', 'approvedBy'].map((item) => ({
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
      ],
      errorIfNotFound: `No code request found for ${field}: ${value}`,
    });
  }

  async updateCodeRequestDetailsSV() {
    const { refcodeId } = this.params;
    const { receivingHcpId: newReceivingHcpId, specialtyId: newSpecialtyId } =
      this.body;

    const refcode = await db.ReferalCode.findById(refcodeId);
    refcode.rejectIfCodeIsExpired();
    refcode.rejectIfCodeIsClaimed();
    refcode.rejectIfCodeIsDeclined();
    refcode.rejectIfCodeIsApproved();

    if (newReceivingHcpId || newSpecialtyId) {
      const specialtyId = newSpecialtyId || refcode.specialtyId;
      const receivingHcp = newReceivingHcpId
        ? await this.validateId('HealthCareProvider', newReceivingHcpId)
        : refcode.receivingHcp;
      await receivingHcp.validateSpecialtyId(specialtyId);
    }

    return refcode.updateAndReload(this.body);
  }

  async updateRefcodeStatus() {
    const { refcodeId } = this.params;
    const operatorId = this.operator.id;
    const { status, stateOfGeneration, flagReason, declineReason } = this.body;

    const refcode = await db.ReferalCode.findById(refcodeId);
    refcode.rejectIfCodeIsExpired();
    refcode.rejectIfCodeIsClaimed();
    refcode.rejectIfCodeIsDeclined();

    let updates = {
      dateDeclined: null,
      declinedById: null,
      dateFlagged: null,
      flaggedById: null,
      dateApproved: null,
      approvedById: null,
      flagReason: null,
      declineReason: null,
    };

    if (status === CODE_STATUS.DECLINED) {
      // we can decline an approved code as long it has not been claimed..
      //  - but without deleting the code, or changing the expiration date
      updates = {
        ...updates,
        dateDeclined: new Date(),
        declinedById: operatorId,
        declineReason,
      };
    } else if (status === CODE_STATUS.FLAGGED) {
      // we can flag an approved code as long it has not been claimed..
      //  - but without deleting the code, or changing the expiration date
      updates = {
        ...updates,
        dateFlagged: new Date(),
        flaggedById: operatorId,
        flagReason,
      };
    } else if (status === CODE_STATUS.APPROVED) {
      refcode.rejectIfCodeIsApproved();
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
        expiresAt,
        stateOfGeneration: refcode.stateOfGeneration || stateOfGeneration,
      };
    }
    return refcode.updateAndReload(updates);
  }

  async verifyClaimsSVC() {
    const { refcodeId } = this.params;
    const refcode = await db.ReferalCode.findById(refcodeId);
    refcode.rejectIfNotApproved();
    refcode.rejectIfClaimsNotFound();
    return refcode.updateAndReload({
      claimsVerifiedOn: new Date(),
      claimsVerifierId: this.operator.id,
    });
  }

  async handleCodeDelete() {
    const { refcodeId } = this.params;

    const refcode = await db.ReferalCode.findById(refcodeId);
    refcode.rejectIfCodeIsExpired();
    refcode.rejectIfCodeIsClaimed();
    refcode.rejectIfCodeIsDeclined();
    refcode.rejectIfCodeIsApproved();

    await refcode.destroy();
    return true;
  }

  async getRefcodes() {
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
}

Object.assign(RefcodeService.prototype, codeFactory);
