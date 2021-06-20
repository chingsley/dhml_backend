import {
  getPaginationParameters,
  generateSearchQuery,
  tableAlias,
} from './helpers.scripts';
const { r, sub } = tableAlias;

export const fetchAllRefcodes = (dialect, dbName, reqQuery = {}) => {
  const { limit, offset } = getPaginationParameters(reqQuery);
  const { searchItem, isFlagged } = reqQuery;
  const generalSearch = generateSearchQuery(searchItem, [
    { tableAlias: sub, column: 'code' },
    { tableAlias: sub, column: 'enrolleeIdNo' },
    { tableAlias: sub, column: 'name' },
    { tableAlias: sub, column: 'scheme' },
    { tableAlias: sub, column: 'referringHcp' },
    { tableAlias: sub, column: 'receivingHcp' },
    { tableAlias: sub, column: 'diagnosis' },
    { tableAlias: sub, column: 'specialty' },
  ]);
  const fallback = `${sub}.id IS NOT NULL`;
  const search = generalSearch || fallback;
  const query =
    isFlagged === undefined
      ? `
SELECT
${sub}.*,
staff1."surname"||' '||staff1."firstName" "declinedBy",
staff2."surname"||' '||staff2."firstName" "flaggedBy",
staff3."surname"||' '||staff3."firstName" "approvedBy"
FROM
(
SELECT 
  r.id, r.code, r."dateDeclined", r."dateFlagged", r."dateApproved", r."declinedById",
  r."flaggedById", r."approvedById", r.diagnosis, r."clinicalFindings",
  e."enrolleeIdNo", e.rank, e.surname||' '||e."firstName" "name", e.scheme,
  refhcp.name||' ('||refhcp.code||')' "referringHcp",
  recvhcp.name||' ('||recvhcp.code||')' "receivingHcp",
  s.name "specialty",
  CASE WHEN r."dateFlagged" IS NOT NULL THEN 'FLAGGED'
      WHEN r."dateApproved" IS NOT NULL THEN 'APPROVED'
      WHEN r."dateDeclined" IS NOT NULL THEN 'DECLINED'
      ELSE 'PENDING'
  END AS status
FROM "ReferalCodes" r
JOIN "Enrollees" e
ON r."enrolleeId" = e.id
JOIN "HealthCareProviders" refhcp
ON      r."referringHcpId" = refhcp.id
JOIN "HealthCareProviders" recvhcp
ON      r."receivingHcpId" = recvhcp.id
JOIN "Specialties" s
ON      r."specialtyId" = s.id
) ${sub}
LEFT JOIN "Users" user1
ON      ${sub}."declinedById" = user1.id
LEFT JOIN "Staffs" staff1
ON      staff1.id = user1."staffId"
LEFT JOIN "Users" user2
ON      ${sub}."flaggedById" = user2.id
LEFT JOIN "Staffs" staff2
ON      staff2.id = user2."staffId"
LEFT JOIN "Users" user3
ON      ${sub}."approvedById" = user3.id
LEFT JOIN "Staffs" staff3
ON      staff3.id = user3."staffId"
WHERE ${search}
LIMIT ${limit}
OFFSET ${offset}
`
      : `
SELECT
${sub}.*,
staff1."surname"||' '||staff1."firstName" "declinedBy",
staff2."surname"||' '||staff2."firstName" "flaggedBy",
staff3."surname"||' '||staff3."firstName" "approvedBy"
FROM
(
SELECT 
  r.id, r.code, r."dateDeclined", r."dateFlagged", r."dateApproved", r."declinedById",
  r."flaggedById", r."approvedById", r.diagnosis, r."clinicalFindings",
  e."enrolleeIdNo", e.rank, e.surname||' '||e."firstName" "name", e.scheme,
  refhcp.name||' ('||refhcp.code||')' "referringHcp",
  recvhcp.name||' ('||recvhcp.code||')' "receivingHcp",
  s.name "specialty",
  CASE WHEN r."dateFlagged" IS NOT NULL THEN 'FLAGGED'
      WHEN r."dateApproved" IS NOT NULL THEN 'APPROVED'
      WHEN r."dateDeclined" IS NOT NULL THEN 'DECLINED'
      ELSE 'PENDING'
  END AS status
FROM "ReferalCodes" r
JOIN "Enrollees" e
ON r."enrolleeId" = e.id AND ${r}."dateFlagged" IS NOT NULL
JOIN "HealthCareProviders" refhcp
ON      r."referringHcpId" = refhcp.id
JOIN "HealthCareProviders" recvhcp
ON      r."receivingHcpId" = recvhcp.id
JOIN "Specialties" s
ON      r."specialtyId" = s.id
) ${sub}
LEFT JOIN "Users" user1
ON      ${sub}."declinedById" = user1.id
LEFT JOIN "Staffs" staff1
ON      staff1.id = user1."staffId"
LEFT JOIN "Users" user2
ON      ${sub}."flaggedById" = user2.id
LEFT JOIN "Staffs" staff2
ON      staff2.id = user2."staffId"
LEFT JOIN "Users" user3
ON      ${sub}."approvedById" = user3.id
LEFT JOIN "Staffs" staff3
ON      staff3.id = user3."staffId"
WHERE ${search}
LIMIT ${limit}
OFFSET ${offset}
`;

  return query;
};

/**
 * SELECT ${r}.id, ${r}.code, ${r}."isFlagged", ${r}."enrolleeId", ${e}."enrolleeIdNo", ${e}.rank, ${e}.surname, ${e}."firstName", ${e}."middleName", ${e}.scheme, ${r}."receivingHcpId", ${h}.name "destinationHcp"
FROM "ReferalCodes" ${r}
JOIN "Enrollees" ${e}
ON ${r}."enrolleeId"=${e}.id AND ${r}."isFlagged"=${JSON.parse(isFlagged)}
JOIN "HealthCareProviders" ${h}
ON 	${r}."receivingHcpId" = ${h}.id
WHERE ${search}
LIMIT ${limit}
OFFSET ${offset}
 */
