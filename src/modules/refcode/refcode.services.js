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
    const { flag, flagReason } = this.body;
    const refcode = await this.findOneRecord({
      modelName: 'ReferalCode',
      where: { id: refcodeId },
      errorIfNotFound: `no referal code matches the id of ${refcodeId}`,
    });
    await refcode.update({ isFlagged: flag, flagReason });
    return refcode;
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
