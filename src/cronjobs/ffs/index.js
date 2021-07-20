const cron = require('node-cron');
import db from '../../database/models';
import claimsScripts from '../../database/scripts/claims.scripts';
import ScriptRunner from '../../utils/QueryRunner';
import SCHEDULES from '../schedules';
import { AFRICA_LAGOS } from '../timezones';
const { log } = console;

async function updateFFSAccountRecords() {
  const t = await db.sequelize.transaction();
  try {
    const { rows, totals } = await fetchFFSMonthlyPaymentByHcps();
    const { id: mfpId } = await db.MonthlyFFSPayment.updateCurrentMonthRecord(
      totals,
      t
    );
    await db.HcpMonthlyFFSPayment.updateCurrentMonthRecords(rows, mfpId, t);
    await t.commit();
    log('', '---@ cronjob started @---');
  } catch (error) {
    await t.rollback();
    log('CRON ERROR: cronjobs/ffs:', error);
  }
}

async function fetchFFSMonthlyPaymentByHcps() {
  const scriptFunc = claimsScripts.getClaimsByHcp;
  const scriptRunner = new ScriptRunner(db);
  const rows = await scriptRunner.execute(scriptFunc, {});
  const totals = rows.reduce(
    (acc, record) => {
      acc.amount += Number(record.amount);
      acc.claims += Number(record.totalClaims);
      return acc;
    },
    { amount: 0, claims: 0 }
  );
  return { rows, totals };
}

module.exports = {
  start: () => {
    log(
      `---@ ffs cronjob set to start: ${SCHEDULES.FFS} (${AFRICA_LAGOS}) @---`
    );
    cron.schedule(
      SCHEDULES.FFS,
      () => {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (today.getMonth() !== tomorrow.getMonth()) {
          // run job only on the last day of the month
          updateFFSAccountRecords();
        }
      },
      {
        timezone: AFRICA_LAGOS,
      }
    );
  },
};
