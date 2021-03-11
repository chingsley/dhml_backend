export const CONTROL_HCPs = ['XX/0000/P', 'XX/0001/P', 'XX/0002/P']
  .map((code) => `'${code}'`)
  .join(', ');

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
