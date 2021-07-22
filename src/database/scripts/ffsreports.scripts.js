import { months } from '../../utils/timers';
import { getPaginationParameters } from './helpers.scripts';

const ffsNhisReport = (__, ___, reqQuery = {}) => {
  const { date } = reqQuery;
  const month = months.firstDay(date);
  const { limit, offset } = getPaginationParameters(reqQuery);
  const query = `
SELECT  h.code "hcpCode", h.name "hcpName",
		e."firstName"||' '||e.surname "beneficiary",
		r.code "authorization", r."claimsVerifiedOn", DATE_TRUNC('month', r."datePaid") "datePaid", SUM(c.unit * c."pricePerUnit") as amount
FROM "ReferalCodes" r
JOIN "Claims" c
  ON r.id = c."refcodeId"
      AND r."datePaid" IS NOT NULL
      AND DATE_TRUNC('month', r."claimsVerifiedOn") <= '${month}'
JOIN "Enrollees" e
  ON e.id = r."enrolleeId"
JOIN "HealthCareProviders" h
  ON h.id = r."receivingHcpId"
GROUP BY 1, 2, 3, 4, 5, 6
ORDER BY h.code ASC, amount DESC
LIMIT ${limit}
OFFSET ${offset}
  `;

  return query;
};

const ffsScripts = {
  ffsNhisReport,
};

export default ffsScripts;
