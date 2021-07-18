import AppService from '../app/app.service';
import db from '../../database/models';
import claimsScripts from '../../database/scripts/claims.scripts';
import ffsHelpers from './ffs.helpers';

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
        ...this.paginate(),
      });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
  async getFFSMonthlyHcpBreakdownSvc() {
    const { mfpId } = this.params;
    const monthlySum = await this.findOneRecord({
      modelName: 'MonthlyFFSPayment',
      where: { id: mfpId },
      errorIfNotFound: `No record found for the mfpId: ${mfpId}`,
      include: {
        model: db.HcpMonthlyFFSPayment,
        as: 'hcpMonthlyFFSPayments',
        ...this.canFilterBySelectedRecords(this.query),
        required: false,
        include: {
          model: db.HealthCareProvider,
          as: 'hcp',
          attributes: ['code', 'name', 'state'],
        },
      },
    });

    return {
      count: monthlySum.hcpMonthlyFFSPayments.length,
      data: this.groupFFSByHcpState(monthlySum.hcpMonthlyFFSPayments),
      totalActualAmount: monthlySum.actualAmount,
      monthlySumData: monthlySum,
    };
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

Object.assign(FFSService.prototype, ffsHelpers);
