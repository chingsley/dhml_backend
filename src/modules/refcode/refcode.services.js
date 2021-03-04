import { Op } from 'sequelize';
import AppService from '../app/app.service';
import db from '../../database/models';
import codeFactory from './refcode.factory';
import {
  stateCodes,
  specialistCodes,
} from '../../shared/constants/statecodes.constants';

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
  async generateReferalCode() {
    const operatorId = this.operator.id;
    const { stateOfGeneration } = this.body;
    const { enrolleeId, destinationHcpId, specialist } = this.body;
    const enrollee = await this.validateId('Enrollee', enrolleeId);
    await this.validateId('HealthCareProvider', destinationHcpId);
    const proxyCode = await this.getProxyCode();
    const stateCode = stateCodes[stateOfGeneration.toLowerCase()];
    const specialistCode = specialistCodes[specialist.toLowerCase()];
    const code = await this.getReferalCode(enrollee, stateCode, specialistCode);
    const refcode = await this.ReferalCodeModel.create({
      ...this.body,
      code,
      proxyCode,
      operatorId,
      specialistCode,
    });

    await refcode.reloadAfterCreate();
    return refcode;
  }

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
    const { flag } = this.body;
    const refcode = await this.findOneRecord({
      modelName: 'ReferalCode',
      where: { id: refcodeId },
      errorIfNotFound: `no referal code matches the id of ${refcodeId}`,
    });
    await refcode.update({ isFlagged: flag });
    return refcode;
  }
}

Object.assign(RefcodeService.prototype, codeFactory);
