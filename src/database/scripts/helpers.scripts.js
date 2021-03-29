import { days, moment, firstDayOfYear } from '../../utils/timers';

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

export function getCapitationFilters(reqQuery) {
  const { limit, offset } = getPaginationParameters(reqQuery);
  const { searchItem, hcpCode, hcpName, date = days.today } = {
    ...reqQuery,
    date: reqQuery.date
      ? moment(reqQuery.date).format('YYYY-MM-DD')
      : undefined,
  };
  const fallback = '"hcpCode" IS NOT NULL';
  const generalSearch =
    searchItem &&
    `LOWER("hcpCode") LIKE '%${searchItem.toLowerCase()}%' OR LOWER("hcpName") LIKE '%${searchItem.toLowerCase()}%' OR LOWER("hcpState") LIKE '%${searchItem.toLowerCase()}%'`;
  const filterByHcpCode =
    hcpCode && `LOWER("hcpCode") LIKE '%${hcpCode.toLowerCase()}%'`;
  const filterByHcpName =
    hcpName && `LOWER("hcpName") LIKE '%${hcpName.toLowerCase()}%'`;
  const filter =
    filterByHcpName || filterByHcpCode || generalSearch || fallback;
  return { limit, offset, date, filter };
}

export const tableAlias = {
  e: 'e',
  r: 'r',
  h: 'h',
};

export const yearly = (year) => firstDayOfYear(year);
