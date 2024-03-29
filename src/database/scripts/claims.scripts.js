import { days, months } from '../../utils/timers';
import { getClaimsFilters, getPaginationParameters } from './helpers.scripts';

// eslint-disable-next-line no-unused-vars
export const getClaimsSummary = (__, ___, reqQuery = {}) => {
  const { filter } = getClaimsFilters(reqQuery);
  const { limit, offset } = getPaginationParameters(reqQuery);

  const query = `
  SELECT  sub.id, sub.code, sub.diagnosis,
  sub."numOfClaims", sub.amount,
  sub."originalNumOfClaims", sub."originalAmount",
  sub."claimsVerifiedOn", sub."claimsDeclineDate",
      refhcp.name "referringHcpName", refhcp.code "referringHcpCode", rechcp.name "receivingHcpName",
      rechcp.code "receivingHcpCode", rechcp.state, e.scheme,
      (s."firstName" || ' ' || s.surname) "verifiedBy", s."staffIdNo" "verifierStaffNumber"
  FROM
    (
    SELECT sub2.*, sub1."numOfClaims", sub1.amount
    FROM
      (
        SELECT r.*,
            COUNT(c.id) as "numOfClaims", SUM(c.unit * c."pricePerUnit") as amount
        FROM "ReferalCodes" r
        JOIN "Claims" c
          ON r.id = c."refcodeId"
        GROUP BY r.id, r.code, r.diagnosis,r."referringHcpId", r."receivingHcpId", r."enrolleeId"
      ) sub1
    JOIN
      (
        SELECT r.*,
            COUNT(o.id) as "originalNumOfClaims", SUM(o.unit * o."pricePerUnit") as "originalAmount"
        FROM "ReferalCodes" r
        JOIN "OriginalClaims" o
          ON r.id = o."refcodeId"
        GROUP BY r.id, r.code, r.diagnosis,r."referringHcpId", r."receivingHcpId", r."enrolleeId"
      ) sub2
    ON sub1.code = sub2.code
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
export const getOriginalClaimsSummary = (__, ___, reqQuery = {}) => {
  const { filter } = getClaimsFilters(reqQuery);
  const { limit, offset } = getPaginationParameters(reqQuery);

  const query = `
  SELECT  sub.id, sub.code, sub.diagnosis,
  sub."numOfClaims", sub."amount",
  sub."claimsVerifiedOn", sub."claimsDeclineDate",
      refhcp.name "referringHcpName", refhcp.code "referringHcpCode", rechcp.name "receivingHcpName",
      rechcp.code "receivingHcpCode", rechcp.state, e.scheme,
      (s."firstName" || ' ' || s.surname) "verifiedBy", s."staffIdNo" "verifierStaffNumber"
  FROM (
  SELECT r.*,
        COUNT(o.id) as "numOfClaims", SUM(o.unit * o."pricePerUnit") as "amount"
  FROM "ReferalCodes" r
  JOIN "OriginalClaims" o
    ON r.id = o."refcodeId"
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
  DATE_TRUNC('month', MIN (r."claimsVerifiedOn")) "earliestClaimsVerificationDate"
FROM "ReferalCodes" r
JOIN "Claims" c
  ON r.id = c."refcodeId"
      AND r."monthPaidFor" IS NULL
      AND DATE_TRUNC('month', r."claimsVerifiedOn") <= '${date}'
JOIN "HealthCareProviders" h
  ON h.id = r."receivingHcpId"
GROUP BY h.id, h.code, h.name, h.state
ORDER BY h.state ASC, amount DESC
LIMIT ${limit}
OFFSET ${offset}
    `;
  // console.log(query);
  return query;
};

const markPaidRefcodes = (__, ___, reqQuery = {}) => {
  const { date, hcpIds } = reqQuery;
  const month = months.firstDay(date);
  const query = `
UPDATE "ReferalCodes" r
SET "monthPaidFor" = '${month}'
WHERE r.id IN
(
SELECT r.id
FROM "ReferalCodes" r
JOIN "Claims" c
    ON r.id = c."refcodeId"
        AND r."monthPaidFor" IS NULL
        AND DATE_TRUNC('month', r."claimsVerifiedOn") <= '${month}'
WHERE r."receivingHcpId" IN (${hcpIds.join(', ')})
)
  `;
  // console.log(query);
  return query;
};

const undoMarkedPaidRefcodes = (__, ___, reqQuery = {}) => {
  const { date, hcpIds } = reqQuery;
  const month = months.firstDay(date);
  const query = `
UPDATE "ReferalCodes" r
SET "monthPaidFor" = NULL
WHERE r.id IN
(
SELECT r.id
FROM "ReferalCodes" r
JOIN "Claims" c
    ON r.id = c."refcodeId"
        AND r."monthPaidFor" IS NOT NULL
        AND DATE_TRUNC('month', r."claimsVerifiedOn") <= '${month}'
WHERE r."receivingHcpId" IN (${hcpIds.join(', ')})
)
  `;
  // console.log(query);
  return query;
};

const claimsScripts = {
  getClaimsSummary,
  getClaimsByHcp,
  markPaidRefcodes,
  undoMarkedPaidRefcodes,
  getOriginalClaimsSummary,
};
export default claimsScripts;
