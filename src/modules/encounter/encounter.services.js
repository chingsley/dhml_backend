/* eslint-disable indent */

import AppService from '../app/app.service';
import db from '../../database/models';

export default class EncounterService extends AppService {
  constructor({ body, files, query, params, user: operator }) {
    super({ body, files, query, params });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
    this.ReferalCodeModel = db.ReferalCode;
    this.operator = operator;
  }

  recordEncounterSVC({
    enrolleeId,
    hcpId,
    provisionalDiagnosis1: diagnosis,
    treatmentCost1: cost,
    prescription,
    isRepeatVisit,
    isReferalVisit,
  }) {
    return db.Encounter.create({
      enrolleeId,
      hcpId,
      diagnosis,
      cost,
      prescription,
      isRepeatVisit,
      isReferalVisit,
    });
  }
}
