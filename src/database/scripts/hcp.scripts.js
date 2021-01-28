import { days } from '../../utils/timers';

// eslint-disable-next-line no-unused-vars
export const getManifest = (dialect, dbName, reqQuery = {}) => {
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
  const query = {
    postgres: `
    SELECT id "hcpId", "hcpCode", "hcpName", "hcpStatus", MAX("verifiedOn") AS "monthOfYear", SUM("principals") principals, SUM("dependants") dependants
    FROM
      (SELECT COALESCE(p.id,d.id) id, COALESCE(p.code,d.code) "hcpCode", COALESCE(p.name,d.name) "hcpName", COALESCE(p.status,d.status) "hcpStatus", COALESCE(p."verifiedOn",d."verifiedOn") "verifiedOn", principals, dependants
      FROM
        (SELECT h.id, h.code, h.name, h.status, DATE_TRUNC('month', "dateVerified") "verifiedOn", count(*) as principals
        FROM "HealthCareProviders" h
        JOIN "Enrollees" e
            ON h.id = e."hcpId"
        WHERE e."principalId" IS NULL AND e."isVerified"=true
        GROUP BY h.id, h.code, h.name, DATE_TRUNC('month', "dateVerified")) AS p
      FULL OUTER JOIN
        (SELECT h.id, h.code, h.name, h.status, DATE_TRUNC('month', "dateVerified") "verifiedOn", count(*) as dependants
        FROM "HealthCareProviders" h
        JOIN "Enrollees" e
            ON h.id = e."hcpId"
        WHERE e."principalId" IS NOT NULL AND e."isVerified"=true
        GROUP BY h.id, h.code, h.name, DATE_TRUNC('month', "dateVerified")) AS d
      ON p.id = d.id AND p."verifiedOn" = d."verifiedOn") sub
    
    WHERE DATE_TRUNC('month', "verifiedOn") <= '${date}' AND ${filter}
    GROUP BY id, "hcpCode", "hcpName", "hcpStatus"
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
  SELECT id "hcpId", "hcpCode", "hcpName", "hcpStatus", MAX("dateVerified") "monthOfYear", SUM(lives) lives, SUM(lives)*750 amount
  FROM
    (SELECT h.id, h.code "hcpCode", h.name "hcpName",h.status "hcpStatus", DATE_TRUNC('month', "dateVerified") "dateVerified", count(e.id) lives
    FROM "HealthCareProviders" h
    JOIN "Enrollees" e
    ON e."hcpId" = h.id AND e."isVerified"=true
    GROUP BY h.id, h.code, h.name, DATE_TRUNC('month', "dateVerified"))sub
  WHERE DATE_TRUNC('month', "dateVerified") <= '${date}' AND ${filter}
  GROUP BY id, "hcpCode", "hcpName", "hcpStatus"
  ORDER BY "hcpName" ASC, "monthOfYear" ASC
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
