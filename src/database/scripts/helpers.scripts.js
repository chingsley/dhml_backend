export function getPaginationParameters(reqQuery = {}) {
  const { page, pageSize } = reqQuery;
  const limit = Number(pageSize) || null;
  const offset = Number(page * pageSize) || 0;
  return { limit, offset };
}

export function generateSearchQuery(searchItem, searchableFields) {
  return (
    searchItem &&
    searchableFields
      .map(
        ({ tableAlias, column }) =>
          `LOWER(${tableAlias}."${column}") LIKE '%${searchItem.toLowerCase()}%'`
      )
      .join(' OR ')
  );
}

export const tableAlias = {
  e: 'e',
  r: 'r',
  h: 'h',
};
