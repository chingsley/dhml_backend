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
SELECT  COALESCE(e."armOfService", 'NOT SPECIFIED') "armOfService", count(e.id)
FROM "Enrollees" e
JOIN "HealthCareProviders" h
	ON e."hcpId" = h.id AND h.code NOT IN (${CONTROL_HCPs})
WHERE e."scheme" = 'AFRSHIP'
GROUP BY e."armOfService"
`;

const activeHcpsByState = () => `
SELECT state, count(id)
FROM "HealthCareProviders"
WHERE status = 'active' AND code NOT IN (${CONTROL_HCPs})
GROUP BY state
`;

const activeHcpsByGeopoliticalZone = () => `
SELECT COALESCE("geopoliticalZone", 'NOT SPECIFIED') "geopoliticalZone", count(id)
FROM "HealthCareProviders"
WHERE status = 'active' AND code NOT IN (${CONTROL_HCPs})
GROUP BY "geopoliticalZone"
`;

export default [
  activeHcps,
  hcpsByArmOfService,
  enrolleesByArmOfService,
  activeHcpsByState,
  activeHcpsByGeopoliticalZone,
];
