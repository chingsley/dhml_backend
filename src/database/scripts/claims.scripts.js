import { days, months } from '../../utils/timers';
import { getClaimsFilters, getPaginationParameters } from './helpers.scripts';

// eslint-disable-next-line no-unused-vars
export const getClaims = (__, ___, reqQuery = {}) => {
  const { filter } = getClaimsFilters(reqQuery);
  const { limit, offset } = getPaginationParameters(reqQuery);

  const query = `
  SELECT  sub.id, sub.code, sub.diagnosis, sub."numOfClaims", sub.amount, sub."claimsVerifiedOn",
          refhcp.name "referringHcpName", refhcp.code "referringHcpCode", rechcp.name "receivingHcpName",
          rechcp.code "receivingHcpCode", rechcp.state, e.scheme,
          (s."firstName" || ' ' || s.surname) "verifiedBy", s."staffIdNo" "verifierStaffNumber"
  FROM (
      SELECT r.*,
          COUNT(c.id) as "numOfClaims", SUM(c.unit * c."pricePerUnit") as amount
      FROM "ReferalCodes" r
      JOIN "Claims" c
      ON r.id = c."refcodeId"
      GROUP BY r.id, r.code, r.diagnosis,r."referringHcpId", r."receivingHcpId", r."enrolleeId"
  ) sub
  JOIN "HealthCareProviders" refhcp
      ON refhcp.id = sub."referringHcpId"
  JOIN "HealthCareProviders" rechcp
      ON rechcp.id = sub."receivingHcpId"
  JOIN "Enrollees" e
      ON e.id = sub."enrolleeId"
  LEFT JOIN "Users" u
      ON u.id = sub."claimsVerifierId"
  LEFT JOIN "Staffs" s
      ON s.id = u."staffId"
  WHERE ${filter}
  ORDER BY sub."numOfClaims" DESC
  LIMIT ${limit}
  OFFSET ${offset}
  `;
  //   console.log(query);
  return query;
};

// eslint-disable-next-line no-unused-vars
const getClaimsByHcp = (__, ___, reqQuery = {}) => {
  const { limit, offset } = getPaginationParameters(reqQuery);
  const { date = months.firstDay(days.today) } = {
    ...reqQuery,
    date: reqQuery.date ? months.firstDay(reqQuery.date) : undefined,
  };
  const query = `
SELECT h.id "hcpId", h.code "hcpCode", h.name "hcpName", h.state,
    COUNT(DISTINCT r.code) as "totalClaims", SUM(c.unit * c."pricePerUnit") as amount,
    DATE_TRUNC('month', MIN (r."claimsVerifiedOn")) "monthVerified",
    CASE WHEN DATE_TRUNC('month', MIN (r."claimsVerifiedOn")) < '${date}' THEN TRUE     
            ELSE FALSE
    END AS "isOverdue"
FROM "ReferalCodes" r
JOIN "Claims" c
    ON r.id = c."refcodeId"
        AND r."auditRequestDate" IS NULL
        AND DATE_TRUNC('month', r."claimsVerifiedOn") <= '${date}'
JOIN "HealthCareProviders" h
    ON h.id = r."receivingHcpId"
GROUP BY h.id, h.code, h.name, h.state
ORDER BY h.state ASC, amount DESC
LIMIT ${limit}
OFFSET ${offset}
    `;
  //   console.log(query);
  return query;
};

const claimsScripts = { getClaims, getClaimsByHcp };
export default claimsScripts;
