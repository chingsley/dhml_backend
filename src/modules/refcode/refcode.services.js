/* eslint-disable indent */
import { Op } from 'sequelize';
import AppService from '../app/app.service';
import db from '../../database/models';
import codeFactory from './refcode.factory';
import {
  stateCodes,
  specialistCodes,
} from '../../shared/constants/statecodes.constants';
import { fetchAllRefcodes } from '../../database/scripts/refcode.scripts';
import { refcodeSearchableFields } from '../../shared/attributes/refcode.attributes';
import errors from '../../shared/constants/errors.constants';
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
    // await this.validateId('Specialty', specialtyId);
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
    const refcode = await this.ReferalCodeModel.create({
      ...this.body,
      enrolleeId: enrollee.id,
      requestState: this.operator.userLocation,
      requestedBy: this.operator.subjectId,
    });

    await refcode.reloadAfterCreate();
    return refcode;
  }

  // async generateReferalCode() {
  //   const operatorId = this.operator.id;
  //   const { stateOfGeneration } = this.body;
  //   const { enrolleeId, receivingHcpId, specialist } = this.body;
  //   const enrollee = await this.validateId('Enrollee', enrolleeId);
  //   await this.validateId('HealthCareProvider', receivingHcpId);
  //   const proxyCode = await this.getProxyCode();
  //   const stateCode = stateCodes[stateOfGeneration.toLowerCase()];
  //   const specialistCode = specialistCodes[specialist.toLowerCase()];
  //   const code = await this.getReferalCode(enrollee, stateCode, specialistCode);
  //   const refcode = await this.ReferalCodeModel.create({
  //     ...this.body,
  //     code,
  //     proxyCode,
  //     operatorId,
  //     specialistCode,
  //   });

  //   await refcode.reloadAfterCreate();
  //   return refcode;
  // }

  async verifyRefcode() {
    const { referalCode: code } = this.query;
    const refcode = await this.findOneRecord({
      modelName: 'ReferalCode',
      where: { code },
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
          model: db.Enrollee,
          as: 'enrollee',
          include: [
            {
              model: db.ReferalCode,
              as: 'referalCodes',
              where: { code: { [Op.not]: code } },
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
      errorIfNotFound: 'Invalid code. No record found',
    });

    this.rejectIf(refcode.isClaimed, {
      withError: errors.claimedRefcode(refcode.expiresAt),
    });
    this.rejectIf(refcode.hasExpired, {
      withError: errors.expiredRefcode(refcode.expiresAt),
    });
    return refcode;
  }

  async updateRefcodeStatus() {
    const { refcodeId } = this.params;
    const operatorId = this.operator.id;
    const { status, stateOfGeneration, flagReason } = this.body;

    const refcode = await this.findOneRecord({
      modelName: 'ReferalCode',
      where: { id: refcodeId },
      errorIfNotFound: `no referal code matches the id of ${refcodeId}`,
    });

    // if code isExpired, then reject update
    // if code isClaimed, then reject update

    let updates = {
      dateDeclined: null,
      declinedById: null,
      dateFlagged: null,
      flaggedById: null,
      dateApproved: null,
      approvedById: null,
    };
    if (status === CODE_STATUS.DECLINED) {
      updates = {
        ...updates,
        dateDeclined: new Date(),
        declinedById: operatorId,
      };
    } else if (status === CODE_STATUS.FLAGGED) {
      updates = {
        ...updates,
        dateFlagged: new Date(),
        flaggedById: operatorId,
        flagReason,
      };
    } else if (status === CODE_STATUS.APPROVED) {
      // if code is genrated, then flagged, then approved again, then:
      // ---- we should not generate a new code, but use the existing code
      // ---- we should use the old expiration date if it exists, otherwise recompute another one
      // ---- we should set the approvedById to the id of the  new approver

      // there maybe other non-status-related fields during update, e.g specialty
      // how do we handle such update. For. If specialty or receiving hcp is changed, we need to validate
      // that the specialty and is in the receiving hcp list of specialties
      const code =
        refcode.code ||
        (await this.generateRefcode(refcodeId, stateOfGeneration));
      const expiresAt = refcode.expiresAt || months.setFuture(3);
      updates = {
        ...updates,
        dateApproved: new Date(),
        approvedById: operatorId,
        code,
        expiresAt,
      };
    }
    await refcode.update(updates);
    // return refcode;
  }

  async handleCodeDelete() {
    const { refcodeIds } = this.body;
    await db.ReferalCode.destroy({ where: { id: refcodeIds } });
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
