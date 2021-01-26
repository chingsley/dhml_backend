import { days } from '../../utils/timers';

// eslint-disable-next-line no-unused-vars
export const getManifest = (dialect, dbName, reqQuery = {}) => {
  const { limit, offset } = getPaginationParameters(reqQuery);

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
      WHERE e."principalId" IS NULL AND e."isVerified"=true 
      GROUP BY h.code, h.name) AS p
    FULL OUTER JOIN
      (SELECT h.code, h.name, count(*) as dependants
      FROM "HealthCareProviders" h
      JOIN "Enrollees" e
          ON h.id = e."hcpId"
      WHERE e."principalId" IS NOT NULL AND e."isVerified"=true
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

// eslint-disable-next-line no-unused-vars
export const getCapitation = (dialect, dbName, reqQuery = {}) => {
  const { limit, offset } = getPaginationParameters(reqQuery);
  const { value, hcpCode, hcpName, date = days.today } = reqQuery;
  const fallback = '"hcpCode" IS NOT NULL';
  const generalSearch =
    value &&
    `LOWER("hcpCode") LIKE '%${value.toLowerCase()}%' OR LOWER("hcpName") LIKE '%${value.toLowerCase()}%'`;
  const filterByHcpCode =
    hcpCode && `LOWER("hcpCode") LIKE '%${hcpCode.toLowerCase()}%'`;
  const filterByHcpName =
    hcpName && `LOWER("hcpName") LIKE '%${hcpName.toLowerCase()}%'`;
  const filter =
    filterByHcpName || filterByHcpCode || generalSearch || fallback;

  const query1 = `
  SELECT "hcpCode", "hcpName", MAX("dateVerified") "month", SUM(lives) lives, SUM(lives)*750 amount
  FROM
    (SELECT h.code "hcpCode", h.name "hcpName", DATE_TRUNC('month', "dateVerified") "dateVerified", count(e.id) lives
    FROM "HealthCareProviders" h
    JOIN "Enrollees" e
    ON e."hcpId" = h.id AND e."isVerified"=true
    GROUP BY h.code, h.name, DATE_TRUNC('month', "dateVerified"))sub
  WHERE DATE_TRUNC('month', "dateVerified") <= '${date}' AND ${filter}
  GROUP BY "hcpCode", "hcpName"
  ORDER BY "hcpName" ASC, "month" ASC
  LIMIT ${limit}
  OFFSET ${offset}
  `;

  const query2 = '';

  const query = { postgres: query1, mysql: query2 };
  return query[dialect];
};

function getPaginationParameters(reqQuery = {}) {
  const { page, pageSize } = reqQuery;
  const limit = Number(pageSize) || null;
  const offset = Number(page * pageSize) || 0;
  return { limit, offset };
}
