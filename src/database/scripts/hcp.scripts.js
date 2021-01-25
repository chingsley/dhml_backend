// SELECT coalesce(p.code,d.code) hcpCode, coalesce(p.name,d.name) hcpName, principals, dependants
// FROM
// 	(SELECT h.code, h.name, count(*) as principals
// 	FROM "HealthCareProviders" h
// 	JOIN "Enrollees" e
// 			ON h.id = e."hcpId"
// 	WHERE e."principalId" IS NULL
// 	GROUP BY h.code, h.name) AS p
// FULL OUTER JOIN
// 	(SELECT h.code, h.name, count(*) as dependants
// 	FROM "HealthCareProviders" h
// 	JOIN "Enrollees" e
// 			ON h.id = e."hcpId"
// 	WHERE e."principalId" IS NOT NULL
// 	GROUP BY h.code, h.name) AS d
// 	ON p.code = d.code

// eslint-disable-next-line no-unused-vars
export const getManifest = (dialect, dbName, reqQuery = {}) => {
  const { page, pageSize } = reqQuery;
  const limit = Number(pageSize) || null;
  const offset = Number(page * pageSize) || 0;

  const { value, hcpCode, hcpName } = reqQuery;
  const fallback = 'WHERE p.code IS NOT NULL OR d.code IS NOT NULL';
  const generalSearch =
    value &&
    `WHERE LOWER(d.code) LIKE '%${value.toLowerCase()}%' OR LOWER(p.code) LIKE '%${value.toLowerCase()}%' OR LOWER(d.name) LIKE '%${value.toLowerCase()}%' OR LOWER(p.name) LIKE '%${value.toLowerCase()}%'`;
  const filterByHcpCode =
    hcpCode &&
    `WHERE LOWER(d.code) LIKE '%${hcpCode.toLowerCase()}%' OR LOWER(p.code) LIKE '%${hcpCode.toLowerCase()}%'`;
  const filterByHcpName =
    hcpName &&
    `WHERE LOWER(d.name) LIKE '%${hcpName.toLowerCase()}%' OR LOWER(p.name) LIKE '%${hcpName.toLowerCase()}%'`;
  const filter =
    filterByHcpName || filterByHcpCode || generalSearch || fallback;
  const query = {
    postgres: `
    SELECT coalesce(p.code,d.code) "hcpCode", coalesce(p.name,d.name) "hcpName", principals, dependants
    FROM
      (SELECT h.code, h.name, count(*) as principals
      FROM "HealthCareProviders" h
      JOIN "Enrollees" e
          ON h.id = e."hcpId"
      WHERE e."principalId" IS NULL 
      GROUP BY h.code, h.name) AS p
    FULL OUTER JOIN
      (SELECT h.code, h.name, count(*) as dependants
      FROM "HealthCareProviders" h
      JOIN "Enrollees" e
          ON h.id = e."hcpId"
      WHERE e."principalId" IS NOT NULL 
      GROUP BY h.code, h.name) AS d
    ON p.code = d.code
    ${filter}
    ORDER BY "hcpName" ASC
    LIMIT ${limit}
    OFFSET ${offset}
      `,
    mysql: `
    `,
  };
  return query[dialect];
};
