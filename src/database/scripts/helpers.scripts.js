import { days, moment, firstDayOfYear, months } from '../../utils/timers';

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
  const {
    searchItem,
    hcpCode,
    hcpName,
    date = days.today,
  } = {
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
  sub: 'sub',
};

export const yearly = (year) => firstDayOfYear(year);

export function getClaimsFilters(reqQuery) {
  const {
    searchItem,
    state,
    receivingHcpCode,
    date,
    isVerified = null,
    operator = {},
  } = {
    ...reqQuery,
    date: reqQuery.date
      ? moment(reqQuery.date).format('YYYY-MM-DD')
      : undefined,
  };

  const { userType } = operator;
  const fallback = 'sub."id" IS NOT NULL';
  const generalSearch =
    searchItem &&
    [
      { table: 'sub', field: 'code' },
      { table: 'sub', field: 'diagnosis' },
      { table: 'refhcp', field: 'name' },
      { table: 'refhcp', field: 'code' },
      { table: 'rechcp', field: 'name' },
      { table: 'rechcp', field: 'code' },
    ]
      .map(
        ({ table, field }) =>
          `LOWER(${table}."${field}") LIKE '%${searchItem?.toLowerCase()}%'`
      )
      .join(' OR ');
  const filterByState = `LOWER(rechcp."state") = '${state?.toLowerCase()}'`;
  const filterByRecevingHcpCode = `LOWER(rechcp."code") = '${receivingHcpCode?.toLowerCase()}'`;
  const filterByDate = `DATE_TRUNC('month', sub."claimsVerifiedOn") = '${months?.firstDay(
    date
  )}'`;

  const filterByVerifiedStatus = (isVerifiedStatus) =>
    isVerifiedStatus === true
      ? 'sub."claimsVerifiedOn" IS NOT NULL'
      : 'sub."claimsVerifiedOn" IS NULL';

  let searchQuery = fallback;
  if (receivingHcpCode) {
    searchQuery = searchQuery + ' AND ' + filterByRecevingHcpCode;
  }
  if (state) {
    searchQuery = searchQuery + ' AND ' + filterByState;
  }
  if (date) {
    searchQuery = searchQuery + ' AND ' + filterByDate;
  }
  if (searchItem) {
    searchQuery = searchQuery + ' AND ' + generalSearch;
  }
  if (isVerified !== null) {
    const status = JSON.parse(String(isVerified).toLowerCase());
    searchQuery = searchQuery + ' AND ' + filterByVerifiedStatus(status);
  }
  if (userType?.toLowerCase() === 'hcp') {
    searchQuery = searchQuery + ' AND ' + `rechcp.id = ${operator.id}`;
  }
  return { filter: searchQuery };
}
