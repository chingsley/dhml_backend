const db = require('../models');
const IS_DEV = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
const { default: claimsScripts } = require('../scripts/claims.scripts');
const { default: ScriptRunner } = require('../../utils/ScriptRunner');
const { months } = require('../../utils/timers');

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: async (queryInterface, Sequelize) => {
    if (IS_DEV) {
      for (const n of [2, 1, 0]) {
        const date = months.setPast(n);
        const { rows, totals } = await fetchFFSMonthlyPaymentByHcps(date);
        const { id: mfpId } = await db.MonthlyFFSPayment.create({
          month: months.firstDay(date),
          totalActualAmt: totals.amount,
          totalActualClaims: totals.claims,
        });
        await db.HcpMonthlyFFSPayment.bulkCreate(
          rows.map((row) => ({ ...row, mfpId }))
        );
      }
    }
    return new Promise((resolve, _) => {
      return resolve();
    });
  },

  // eslint-disable-next-line no-unused-vars
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('HcpMonthlyFFSPayments', null, {});
    await queryInterface.bulkDelete('MonthlyFFSPayments', null, {});
  },
};

async function fetchFFSMonthlyPaymentByHcps(date) {
  const script = claimsScripts.getClaimsByHcp;
  const scriptRunner = new ScriptRunner(db.sequelize);
  const rows = await scriptRunner.execute(script, { date });
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
