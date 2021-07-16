import AppService from '../app/app.service';
import db from '../../database/models';
import claimsScripts from '../../database/scripts/claims.scripts';

export default class FFSService extends AppService {
  constructor({ body, files, query, params }) {
    super({ body, files, query, params });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
  }

  async getFFSMonthlyPaymentsSvc() {
    const t = await db.sequelize.transaction();
    try {
      const { rows, totals } = await this.fetchFFSMonthlyPaymentByHcps();
      const { id: mfpId } = await db.MonthlyFFSPayment.updateCurrentMonthRecord(
        totals,
        t
      );
      await db.HcpMonthlyFFSPayment.updateCurrentMonthRecords(rows, mfpId, t);
      await t.commit();
      return db.MonthlyFFSPayment.findAndCountAll({
        ...this.paginate,
      });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async fetchFFSMonthlyPaymentByHcps() {
    const script = claimsScripts.getClaimsByHcp;
    const rows = await this.executeQuery(script, {});
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
}
