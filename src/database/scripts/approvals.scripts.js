import { months } from '../../utils/timers';
import { CONTROL_HCPs } from './helpers.scripts';

const rateInNaira = Number(process.env.RATE_IN_NAIRA);

/**
 * gets the total capitation for all hcps from begining to current date
 * 'currentMonth' is what gets in the CapitationApprovals table as 'month'
 * 'lastVerified' month is the last month when an enrollee from any...
 *    hcp was verified; it is purely informational and not in use.
 * @param {string} dialect database dialect (postgres/mysql)
 * @param {string} dbName database name, needed for mysql queries
 * @returns string literal: the SQL query
 */

export const monthlyCapSum = (dialect, dbName, filters) => {
  const { date = months.currentMonth } = filters;
  // console.log(date);
  const query1 = `
  SELECT '${date}' "month", COALESCE(SUM(lives), 0) lives, ${rateInNaira} "rateInNaira", COALESCE(SUM(lives)*${rateInNaira} , 0) amount, MAX("month") "lastVerifiedMonth"
  FROM
  (
  SELECT DATE_TRUNC('month', "dateVerified") "month", count(e.id) lives, count(e.id) * ${rateInNaira} amount
  FROM "HealthCareProviders" h
  JOIN "Enrollees" e
      ON e."hcpId" = h.id AND e."isVerified"=true AND e."isActive"=true AND h.status='active' AND h.code NOT IN (${CONTROL_HCPs})
  WHERE DATE_TRUNC('month', "dateVerified") <= '${date}'
  GROUP BY DATE_TRUNC('month', "dateVerified")
  ORDER BY "month" DESC
  )sub
  `;
  const query2 = '';
  const query = { postgres: query1, mysql: query2 };
  return query[dialect];
};
