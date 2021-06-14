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
  async createRequestForReferalCodeSVC() {
    const {
      enrolleeIdNo,
      referringHcpId,
      receivingHcpId,
      specialtyId,
      ...newEnrolleeData
    } = this.body;
    await this.validateId('HealthCareProvider', referringHcpId);
    await this.validateId('HealthCareProvider', receivingHcpId);
    await this.validateId('Specialty', specialtyId);
    const enrollee = enrolleeIdNo
      ? await this.findOneRecord({
        where: { enrolleeIdNo },
        modelName: 'Enrollee',
        errorIfNotFound: 'Invalid enrollee Id No. Record not found',
      })
      : await this.registerNewEnrollee(newEnrolleeData);
    const refcode = await this.ReferalCodeModel.create({
      ...this.body,
      enrolleeId: enrollee.id,
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
    return await this.findOneRecord({
      modelName: 'ReferalCode',
      where: { code },
      include: [
        {
          model: db.HealthCareProvider,
          as: 'destinationHcp',
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
            },
          ],
        },
      ],
      errorIfNotFound: 'Invalid code. No record found',
    });
  }

  async setCodeFlagStatus() {
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
    });
    const count = nonPaginatedRows.length;
    const rows = await this.executeQuery(fetchAllRefcodes, this.query);
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
          as: 'destinationHcp',
          attributes: ['name', 'code'],
        },
        {
          model: db.User,
          as: 'generatedBy',
          attributes: ['id', 'staffId', 'username'],
          include: {
            model: db.Staff,
            as: 'staffInfo',
            attributes: [
              'id',
              'staffIdNo',
              'email',
              'surname',
              'firstName',
              'middleName',
            ],
          },
        },
      ],
    });
    refcodeHistory.enrollee = enrollee;
    return refcodeHistory;
  }
}

Object.assign(RefcodeService.prototype, codeFactory);
