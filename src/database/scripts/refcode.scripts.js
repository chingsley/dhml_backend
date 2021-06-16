import {
  getPaginationParameters,
  generateSearchQuery,
  tableAlias,
} from './helpers.scripts';
const { e, r, h } = tableAlias;

export const fetchAllRefcodes = (dialect, dbName, reqQuery = {}) => {
  const { limit, offset } = getPaginationParameters(reqQuery);
  const { searchItem, isFlagged } = reqQuery;
  const generalSearch = generateSearchQuery(searchItem, [
    { tableAlias: r, column: 'code' },
    { tableAlias: e, column: 'enrolleeIdNo' },
    { tableAlias: e, column: 'rank' },
    { tableAlias: e, column: 'surname' },
    { tableAlias: e, column: 'middleName' },
    { tableAlias: e, column: 'firstName' },
    { tableAlias: e, column: 'scheme' },
  ]);
  const fallback = 'r.code IS NOT NULL';
  const search = generalSearch || fallback;
  const query = {
    postgres:
      isFlagged === undefined
        ? `
    SELECT ${r}.id, ${r}.code, ${r}."isFlagged", ${r}."enrolleeId", ${e}."enrolleeIdNo", ${e}.rank, ${e}.surname, ${e}."firstName", ${e}."middleName", ${e}.scheme, ${r}."receivingHcpId", ${h}.name "destinationHcp"
    FROM "ReferalCodes" ${r}
    JOIN "Enrollees" ${e}
      ON ${r}."enrolleeId" = ${e}.id
    JOIN "HealthCareProviders" ${h}
      ON 	${r}."receivingHcpId" = ${h}.id
    WHERE ${search}
    LIMIT ${limit}
    OFFSET ${offset}
    `
        : `
    SELECT ${r}.id, ${r}.code, ${r}."isFlagged", ${r}."enrolleeId", ${e}."enrolleeIdNo", ${e}.rank, ${e}.surname, ${e}."firstName", ${e}."middleName", ${e}.scheme, ${r}."receivingHcpId", ${h}.name "destinationHcp"
    FROM "ReferalCodes" ${r}
    JOIN "Enrollees" ${e}
      ON ${r}."enrolleeId"=${e}.id AND ${r}."isFlagged"=${JSON.parse(isFlagged)}
    JOIN "HealthCareProviders" ${h}
      ON 	${r}."receivingHcpId" = ${h}.id
    WHERE ${search}
    LIMIT ${limit}
    OFFSET ${offset}
    `,
    mysql: `
    `,
  };

  return query[dialect];
};
