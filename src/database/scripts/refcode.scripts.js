import {
  HOD_MEDICAL,
  MD,
  TIER_1_MEDICAL,
  TIER_2_MEDICAL,
} from '../../shared/constants/roles.constants';
import {
  getPaginationParameters,
  generateSearchQuery,
  tableAlias,
} from './helpers.scripts';
const { r, sub } = tableAlias;

const filterByOperatorRoleAndLocation = (operator) => {
  const superRoles = [MD, HOD_MEDICAL, TIER_1_MEDICAL, TIER_2_MEDICAL];
  const operatorRole = operator.role.title;
  const operatorLocation = operator.userLocation;

  if (operatorRole === 'hcp') {
    return `WHERE LOWER(refhcp."code") = '${operator.code?.toLowerCase()}' OR LOWER(recvhcp."code") = '${operator.code?.toLowerCase()}'`;
  } else if (!superRoles.includes(operatorRole)) {
    return `WHERE LOWER(r."requestState") = '${operatorLocation?.toLowerCase()}'`;
  } else {
    return '--';
  }
};

export const fetchAllRefcodes = (dialect, dbName, reqQuery = {}) => {
  const { limit, offset } = getPaginationParameters(reqQuery);
  const { searchItem, isFlagged, operator } = reqQuery;
  const generalSearch = generateSearchQuery(searchItem, [
    { tableAlias: sub, column: 'code' },
    { tableAlias: sub, column: 'enrolleeIdNo' },
    { tableAlias: sub, column: 'name' },
    { tableAlias: sub, column: 'scheme' },
    { tableAlias: sub, column: 'referringHcp' },
    { tableAlias: sub, column: 'receivingHcp' },
    { tableAlias: sub, column: 'receivingHcpCode' },
    { tableAlias: sub, column: 'referringHcpCode' },
    { tableAlias: sub, column: 'diagnosis' },
    { tableAlias: sub, column: 'specialty' },
  ]);
  const fallback = `${sub}.id IS NOT NULL`;
  const search = generalSearch || fallback;

  const query = `
SELECT
${sub}.*,
staff1."surname"||' '||staff1."firstName" "declinedBy",
staff2."surname"||' '||staff2."firstName" "flaggedBy",
staff3."surname"||' '||staff3."firstName" "approvedBy"
FROM
(
SELECT 
  r.id, r.code, r."dateDeclined", r."dateFlagged", r."dateApproved", r."declinedById",
  r."flaggedById", r."approvedById", r.diagnosis, r."clinicalFindings", r."requestState", r."requestedBy",
  e."enrolleeIdNo", e.rank, e.surname||' '||e."firstName" "name", e.scheme,
  refhcp.name "referringHcp", refhcp."code" "referringHcpCode",
  recvhcp.name "receivingHcp", recvhcp."code" "receivingHcpCode",
  s.name "specialty",
  CASE WHEN r."dateDeclined" IS NOT NULL THEN 'DECLINED'
      WHEN r."dateFlagged" IS NOT NULL THEN 'FLAGGED'      
      WHEN r."dateApproved" IS NOT NULL THEN 'APPROVED'
      ELSE 'PENDING'
  END AS status
FROM "ReferalCodes" r
JOIN "Enrollees" e
ON r."enrolleeId" = e.id ${filterByFlaggedStatus(isFlagged)}
JOIN "HealthCareProviders" refhcp
ON      r."referringHcpId" = refhcp.id
JOIN "HealthCareProviders" recvhcp
ON      r."receivingHcpId" = recvhcp.id
JOIN "Specialties" s
ON      r."specialtyId" = s.id
${filterByOperatorRoleAndLocation(operator)}
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

function filterByFlaggedStatus(isFlagged) {
  return isFlagged ? `AND ${r}."dateFlagged" IS NOT NULL` : '--';
}
