const cron = require('node-cron');
import db from '../../database/models';
import claimsScripts from '../../database/scripts/claims.scripts';
import ScriptRunner from '../../utils/ScriptRunner';
import SCHEDULES from '../schedules';
import { AFRICA_LAGOS } from '../timezones';
const { log } = console;

async function updateFFSAccountRecords() {
  try {
    const { rows, totals } = await fetchFFSMonthlyPaymentByHcps();
    const { id: mfpId } = await db.MonthlyFFSPayment.updateCurrentMonthRecord(
      totals
    );
    await db.HcpMonthlyFFSPayment.updateCurrentMonthRecords(rows, mfpId);
    log('', '---@ cronjob done @---');
  } catch (error) {
    log('CRON ERROR: cronjobs/ffs:', error);
  }
}

async function fetchFFSMonthlyPaymentByHcps() {
  const scriptFunc = claimsScripts.getClaimsByHcp;
  const scriptRunner = new ScriptRunner(db.sequelize);
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
        log('', '---@ cronjob started @---');
        /**
         * WE CALL 'updateFFSAccountRecords()' HERE TO RUN THE
         * COMPUTATION ONCE EVERY DAY
         */
        updateFFSAccountRecords();

        /**
         * BUT IF WE DECIDE TO RUN THE COMPUTATION ON THE LAST DAY OF EVERY
         * MONTH, THEN WE WILL USE THE BLOCK OF CODE BELOW AND COMMENT OUT
         *  THE CALL TO 'updateFFSAccountRecords()' ABOVE
         */
        // const today = new Date();
        // const tomorrow = new Date();
        // tomorrow.setDate(tomorrow.getDate() + 1);
        // // run job only on the last day of the month
        // if (today.getMonth() !== tomorrow.getMonth()) {
        //   updateFFSAccountRecords();
        // }
      },
      {
        timezone: AFRICA_LAGOS,
      }
    );
  },
};
