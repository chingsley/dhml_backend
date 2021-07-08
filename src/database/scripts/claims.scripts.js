import { getClaimsFilters, getPaginationParameters } from './helpers.scripts';

// eslint-disable-next-line no-unused-vars
export const getClaims = (__, ___, reqQuery = {}) => {
  const { filter } = getClaimsFilters(reqQuery);
  const { limit, offset } = getPaginationParameters(reqQuery);

  const query = `
SELECT  sub.id, sub.code, sub.diagnosis, sub."numOfClaims", sub.amount, sub."claimsVerifiedOn",
        refhcp.name "referringHcpName", refhcp.code "referringHcpCode", rechcp.name "receivingHcpName",
        rechcp.code "receivingHcpCode", rechcp.state, e.scheme
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
WHERE ${filter}
ORDER BY sub."numOfClaims" DESC
LIMIT ${limit}
OFFSET ${offset}
  `;
  // console.log(query);
  return query;
};

const claimsScripts = { getClaims };
export default claimsScripts;
