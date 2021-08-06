--1. total encounters:
-------------------------------------------------------------------------
SELECT COUNT(*) "totalEncounters" FROM "Encounters"
WHERE DATE_TRUNC('month', "createdAt") = '2021-07-01'
----------------------------------------


--2. avg encounter per hcp:
-------------------------------------------------------------------------
-- -- -- SELECT  (encounters.count::decimal / hcps.count::decimal)::NUMERIC(10, 2) AS "averageEncounterPerHcp"
SELECT  (encounters.count::decimal / hcps.count::decimal) AS "averageEncounterPerHcp"
FROM
(
	SELECT COUNT(*) FROM "Encounters"
	WHERE DATE_TRUNC('month', "createdAt") = '2021-07-01'
) encounters
JOIN
(
	SELECT COUNT(DISTINCT "hcpId") FROM "Encounters"
	WHERE DATE_TRUNC('month', "createdAt") = '2021-07-01'
) hcps ON 1=1
----------------------------------------


--3. totalReferalRate:
-------------------------------------------------------------------------
SELECT  (referals.count::decimal / total.count::decimal)*100 AS "totalReferalRate"
FROM
(
	SELECT COUNT(*) FROM "Encounters"
	WHERE DATE_TRUNC('month', "createdAt") = '2021-07-01'

) total
JOIN
(
	SELECT COUNT(*) FROM "Encounters" WHERE "isReferalVisit" = TRUE
	AND DATE_TRUNC('month', "createdAt") = '2021-07-01'

) referals ON 1=1
----------------------------------------


--4. averageCostOfEncounter:
-------------------------------------------------------------------------
SELECT AVG("cost") FROM "Encounters"
WHERE DATE_TRUNC('month', "createdAt") = '2021-07-01'
----------------------------------------


--5. nhis-returns for encounter
-------------------------------------------------------------------------
SELECT e."hcpId" "hcpId", h.code, h.name, 
		COUNT(e.id) "totalEncounter", 
		SUM(e.cost) "totalCost", 
		'2021-07-01' "period"
FROM "Encounters" e
JOIN "HealthCareProviders" h
	ON e."hcpId" = h.id
WHERE DATE_TRUNC('month', e."createdAt") = '2021-07-01'
GROUP BY 1, 2, 3
ORDER BY "totalEncounter" DESC
----------------------------------------



--6. Disease Patterns - Top 10 for a given month
-------------------------------------------------------------------------
SELECT diagnosis, COUNT(id) "numOfCases"
FROM "Encounters"
WHERE DATE_TRUNC('month', "createdAt") = '2021-07-01'
GROUP BY diagnosis
ORDER BY "numOfCases" DESC
LIMIT 10
----------------------------------------