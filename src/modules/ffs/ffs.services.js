import AppService from '../app/app.service';
import { Op } from 'sequelize';
import db from '../../database/models';
import claimsScripts from '../../database/scripts/claims.scripts';
import ffsHelpers from './ffs.helpers';
import { firstDayOfLastMonth } from '../../utils/timers';

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
    const { selectedAmount } = await this.handlePreselection(mfpId);
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
      totalSelectedAmount: selectedAmount,
    };
  }

  async requestAuditSVC() {
    // expect path PATCH /monthly-ffs/:mfpId
    // expect an array of the hcp's that have been selected
    // const returnedRecords = update HcpMonthlyFSSPayments, set auditRequestDate = new Date() where: hcpIds
    // const selectedAmount = reduce to sum individual amounts of the returnedRecords
    // update MonthlyFFSPayments, set selectedAmount = selectedAmount where id: mfpId
    // return
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

  async handlePreselection(mfpId) {
    const [__, updatedRecords] = await db.HcpMonthlyFFSPayment.update(
      {
        auditRequestDate: new Date(),
      },
      {
        where: {
          mfpId,
          earliestClaimsVerificationDate: {
            [Op.lt]: new Date(firstDayOfLastMonth),
          },
        },
        returning: true,
      }
    );
    const selectedAmount = updatedRecords.reduce((acc, record) => {
      acc += Number(record.amount);
      return acc;
    }, 0);
    db.MonthlyFFSPayment.update({ selectedAmount }, { where: { id: mfpId } });

    return { selectedAmount, updatedRecords };
  }
}

Object.assign(FFSService.prototype, ffsHelpers);
