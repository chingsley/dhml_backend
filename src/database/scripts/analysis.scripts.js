import { yearly } from './helpers.scripts';

export const capitationByArmOfService = (_, __, { date: year }) => `
SELECT *
FROM
(
SELECT COALESCE(h."armOfService", 'CIVIL') "armOfService", hmc.month, SUM(hmc.lives) lives, SUM(hmc.amount) amount
FROM  "HcpMonthlyCapitations" hmc
LEFT JOIN "HealthCareProviders" h
	ON hmc."hcpId" = h.id
GROUP BY "armOfService", hmc.month
ORDER BY "armOfService" ASC, month ASC
) monthly
${year ? `WHERE DATE_TRUNC('year', "month") = '${yearly(year)}'` : '--'}
`;

const ffsReports = (_, __, { date: year }) => {
  const query = `
SELECT *
FROM
(
SELECT COALESCE(h."armOfService", 'CIVIL') "armOfService", mfp."month" "month", SUM(hmfp."totalClaims") claims, SUM(hmfp.amount) amount
FROM  "HcpMonthlyFFSPayments" hmfp
JOIN "HealthCareProviders" h
        ON hmfp."hcpId" = h.id
        AND hmfp."auditRequestDate" IS NOT NULL
JOIN "MonthlyFFSPayments" mfp
		ON mfp.id = hmfp."mfpId"
		AND mfp."datePaid" IS NOT NULL
GROUP BY "armOfService", mfp."month"
ORDER BY "armOfService" ASC, "month" ASC
) monthly
${year ? `WHERE DATE_TRUNC('year', "month") = '${yearly(year)}'` : '--'}
	`;

  return query;
};

const analysisScripts = {
  ffsReports,
};

export default analysisScripts;
