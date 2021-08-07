import { months } from '../../utils/timers';
import { getPaginationParameters } from './helpers.scripts';

const totalEncountersForMonth = (__, ___, reqQuery = {}) => {
  const month = months.firstDay(reqQuery.month);
  const query = `
  SELECT COUNT(*) "value" FROM "Encounters"
  WHERE DATE_TRUNC('month', "createdAt") = '${month}'
  `;

  return query;
};

const avgEncounterPerHcpForMonth = (__, ___, reqQuery = {}) => {
  const month = months.firstDay(reqQuery.month);
  const query = `
  SELECT  (encounters.count::decimal / hcps.count::decimal) AS "value"
  FROM
  (
    SELECT COUNT(*) FROM "Encounters"
    WHERE DATE_TRUNC('month', "createdAt") = '${month}'
  ) encounters
  JOIN
  (
    SELECT COUNT(DISTINCT "hcpId") FROM "Encounters"
    WHERE DATE_TRUNC('month', "createdAt") = '${month}'
  ) hcps ON 1=1
  `;

  return query;
};

const totalReferalRateForMonth = (__, ___, reqQuery = {}) => {
  const month = months.firstDay(reqQuery.month);
  const query = `
  SELECT  (referals.count::decimal / total.count::decimal)*100 AS "value"
  FROM
  (
    SELECT COUNT(*) FROM "Encounters"
    WHERE DATE_TRUNC('month', "createdAt") = '${month}'
  
  ) total
  JOIN
  (
    SELECT COUNT(*) FROM "Encounters" WHERE "isReferalVisit" = TRUE
    AND DATE_TRUNC('month', "createdAt") = '${month}'
  
  ) referals ON 1=1
  `;

  return query;
};

const averageCostOfEncounterForMonth = (__, ___, reqQuery = {}) => {
  const month = months.firstDay(reqQuery.month);
  const query = `
  SELECT AVG("cost") AS "value" FROM "Encounters"
  WHERE DATE_TRUNC('month', "createdAt") = '${month}'
  `;

  return query;
};

const nhisReturnsForMonth = (__, ___, reqQuery = {}) => {
  const month = months.firstDay(reqQuery.month);
  const { limit, offset } = getPaginationParameters(reqQuery);
  const query = `
  SELECT e."hcpId" "hcpId", h.code, h.name, 
  COUNT(e.id) "totalEncounter", 
  SUM(e.cost) "totalCost", 
  '${month}' "period"
  FROM "Encounters" e
  JOIN "HealthCareProviders" h
  ON e."hcpId" = h.id
  WHERE DATE_TRUNC('month', e."createdAt") = '${month}'
  GROUP BY 1, 2, 3
  ORDER BY "totalEncounter" DESC
  LIMIT ${limit}
  OFFSET ${offset}
  `;

  return query;
};

const top10DiseaseEncontersForMonth = (__, ___, reqQuery = {}) => {
  const month = months.firstDay(reqQuery.month);
  const query = `
  SELECT diagnosis, COUNT(id) "numOfCases"
  FROM "Encounters"
  WHERE DATE_TRUNC('month', "createdAt") = '${month}'
  GROUP BY diagnosis
  ORDER BY "numOfCases" DESC
  LIMIT 10
  `;

  return query;
};

const encounterSrcipts = {
  totalEncountersForMonth,
  avgEncounterPerHcpForMonth,
  totalReferalRateForMonth,
  averageCostOfEncounterForMonth,
  nhisReturnsForMonth,
  top10DiseaseEncontersForMonth,
};

export default encounterSrcipts;
