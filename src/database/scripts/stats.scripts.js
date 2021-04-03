import { CONTROL_HCPs } from './helpers.scripts';

const activeHcps = () => `
SELECT status, count(id)
FROM "HealthCareProviders"
WHERE code NOT IN (${CONTROL_HCPs})
GROUP BY status
`;

const hcpsByArmOfService = () => `
SELECT COALESCE("armOfService", 'CIVIL') "armOfService", count(id)
FROM "HealthCareProviders"
WHERE code NOT IN (${CONTROL_HCPs})
GROUP BY "armOfService"
`;

const enrolleesByArmOfService = () => `
SELECT  COALESCE(e."armOfService", 'unspecified') "armOfService", count(e.id) "count"
FROM "Enrollees" e
JOIN "HealthCareProviders" h
	ON e."hcpId" = h.id AND h.code NOT IN  (${CONTROL_HCPs})
WHERE e."scheme" = 'AFRSHIP'
GROUP BY e."armOfService"
`;

const activeHcpsByState = () => `
SELECT state, count(id)
FROM "HealthCareProviders"
WHERE status = 'active' AND code NOT IN (${CONTROL_HCPs})
GROUP BY state
`;

const hcpsByCategory = () => `
SELECT "category", count(id)
FROM "HealthCareProviders"
WHERE code NOT IN (${CONTROL_HCPs})
GROUP BY "category"
`;

const enrolleesByVerifiedStatus = () => `
SELECT  CASE WHEN e."isVerified" = TRUE THEN TRUE ELSE FALSE END AS "isVerified",
		COUNT(e.id)
FROM "Enrollees" e
JOIN "HealthCareProviders" h
	ON e."hcpId" = h.id AND h.code NOT IN (${CONTROL_HCPs})
GROUP BY "isVerified"
`;

export const afrshipPrincipalsByServiceStatus = () => `
SELECT   CASE WHEN e."serviceStatus" IS NULL THEN 'unspecified' ELSE e."serviceStatus" END, COUNT(e.id)
FROM "Enrollees" e
JOIN "HealthCareProviders" h
	ON e."hcpId" = h.id AND h.code NOT IN (${CONTROL_HCPs})
WHERE e."principalId" IS NULL AND e.scheme = 'AFRSHIP'
GROUP BY e."serviceStatus"
`;

export const enrolleesByScheme = () => `
SELECT   CASE WHEN e."scheme" IS NULL THEN 'unspecified' ELSE e."scheme" END, COUNT(e.id)--, e.scheme, e."principalId"
FROM "Enrollees" e
JOIN "HealthCareProviders" h
	ON e."hcpId" = h.id AND h.code NOT IN (${CONTROL_HCPs})
GROUP BY e."scheme"
`;

export const avgDurationForVerification = () => `
SELECT CEIL(AVG(DATE_PART('day', "dateVerified" - "createdAt"))) days
FROM "Enrollees"
WHERE "isVerified" = TRUE --AND DATE_TRUNC('month', "dateVerified")  = DATE_TRUNC('month', CURRENT_DATE)
`;

export default [
  activeHcps,
  hcpsByArmOfService,
  enrolleesByArmOfService,
  activeHcpsByState,
  hcpsByCategory,
  enrolleesByVerifiedStatus,
  afrshipPrincipalsByServiceStatus,
  enrolleesByScheme,
  avgDurationForVerification,
];
