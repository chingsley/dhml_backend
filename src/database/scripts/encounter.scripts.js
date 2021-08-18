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

const hcpListForMonth = (__, ___, reqQuery = {}) => {
  const month = months.firstDay(reqQuery.month);
  const query = `
  SELECT MIN(h.name) "name", h.code
  FROM "Encounters" e
  JOIN "HealthCareProviders" h
    ON e."hcpId" = h.id
    AND DATE_TRUNC('month', e."createdAt") = '${month}'
  GROUP BY h.code
  
  `;
  return query;
};

const hcpDiseasePatternForMonth = (__, ___, reqQuery = {}) => {
  const month = months.firstDay(reqQuery.month);
  const { hcpCode } = reqQuery;
  const query = `
  SELECT diagnosis AS disease, "ageGroup", COUNT(id)
  FROM
  (
    SELECT e.id, e.diagnosis, date_part('year',age(en."dateOfBirth")) "age",
    CASE WHEN date_part('year',age(en."dateOfBirth")) <= 4 THEN '0-4'
    WHEN date_part('year',age(en."dateOfBirth")) <= 9 THEN '5-9'
    WHEN date_part('year',age(en."dateOfBirth")) <= 14 THEN '10-14'
    WHEN date_part('year',age(en."dateOfBirth")) <= 19 THEN '15-19'
    WHEN date_part('year',age(en."dateOfBirth")) <= 24 THEN '20-24'
    WHEN date_part('year',age(en."dateOfBirth")) <= 29 THEN '25-29'
    WHEN date_part('year',age(en."dateOfBirth")) <= 34 THEN '30-34'
    WHEN date_part('year',age(en."dateOfBirth")) <= 39 THEN '35-39'
    WHEN date_part('year',age(en."dateOfBirth")) <= 44 THEN '40-44'
    WHEN date_part('year',age(en."dateOfBirth")) <= 49 THEN '45-49'
    WHEN date_part('year',age(en."dateOfBirth")) <= 54 THEN '50-54'
    WHEN date_part('year',age(en."dateOfBirth")) <= 59 THEN '55-59'
    ELSE
    '60+'
    END AS "ageGroup"
    FROM "Encounters" e
    JOIN "Enrollees" en
    ON e."enrolleeId" = en.id
    JOIN "HealthCareProviders" h
    ON e."hcpId" = h.id
    AND DATE_TRUNC('month', e."createdAt") = '${month}'
    AND LOWER(h.code) = '${hcpCode.toLowerCase()}'
    ) sub
    GROUP BY disease, "ageGroup"
    ORDER BY disease ASC, "ageGroup"
    `;

  return query;
};

const hcpEncounterReportForMonth = (__, ___, reqQuery = {}) => {
  const month = months.firstDay(reqQuery.month);
  const { hcpCode } = reqQuery;
  const query = `
SELECT e.id, e."createdAt" date, (p."firstName"||' '||p.surname ) "name",
p."serviceNumber",  date_part('year',age(p."dateOfBirth")) "age",  
p.gender, e.diagnosis, e."isRepeatVisit", e.prescription, 
ROUND(e.cost, 2) "treatmentCost", e."isReferalVisit", '-' "referalReason",
0 "ffsCost" 
FROM "Encounters" e
JOIN "Enrollees" p
	ON e."enrolleeId" = p.id
JOIN "HealthCareProviders" h
	ON e."hcpId" = h.id
	AND DATE_TRUNC('month', e."createdAt") = '${month}'
	AND LOWER(h.code) = '${hcpCode.toLowerCase()}'
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
  hcpListForMonth,
  hcpDiseasePatternForMonth,
  hcpEncounterReportForMonth,
};

export default encounterSrcipts;
