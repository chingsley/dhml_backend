/* eslint-disable indent */
import AppService from '../app/app.service';
import db from '../../database/models';
import encounterSrcipts from '../../database/scripts/encounter.scripts';
import encounterHelpers from './encounter.helpers';

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

  async getTotalEncounterForGivenMonthSVC() {
    const result = await this.executeQuery(
      encounterSrcipts.totalEncountersForMonth,
      this.query
    );
    return result;
  }

  async getAvgEncounterPerHcpForGivenMonthSVC() {
    const result = await this.executeQuery(
      encounterSrcipts.avgEncounterPerHcpForMonth,
      this.query
    );
    return result;
  }

  async getTotalReferalRateForGivenMonthSVC() {
    const result = await this.executeQuery(
      encounterSrcipts.totalReferalRateForMonth,
      this.query
    );
    return result;
  }

  async getAvgCostForGivenMonthSVC() {
    const result = await this.executeQuery(
      encounterSrcipts.averageCostOfEncounterForMonth,
      this.query
    );
    return result;
  }

  async getNhisReturnsForGivenMonthSVC() {
    const script = encounterSrcipts.nhisReturnsForMonth;
    return this.getPaginatedData(script, this.query);
  }

  async getTop10DiseaseForGivenMonthSVC() {
    const script = encounterSrcipts.top10DiseaseEncontersForMonth;
    const result = await this.executeQuery(script, this.query);
    return result;
  }
  async getHcpListForGivenMonthSVC() {
    const script = encounterSrcipts.hcpListForMonth;
    return this.getPaginatedData(script, this.query);
  }

  async getHcpDiseasePatternForGivenMonthSVC() {
    const script = encounterSrcipts.hcpDiseasePatternForMonth;
    const rows = await this.executeQuery(script, this.query);
    return this.formatHcpDiseasePatterns(rows);
  }
  async getHcpEncounterReportForGivenMonthSVC() {
    const script = encounterSrcipts.hcpEncounterReportForMonth;
    return this.executeQuery(script, this.query);
  }
}

Object.assign(EncounterService.prototype, encounterHelpers);
