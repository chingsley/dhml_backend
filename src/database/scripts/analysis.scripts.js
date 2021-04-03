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
