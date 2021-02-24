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
    return this.ReferalCodeModel.create({
      ...this.body,
      code,
      proxyCode,
      operatorId,
      specialistCode,
    });
  }
}

Object.assign(RefcodeService.prototype, codeFactory);
