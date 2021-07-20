import AppService from '../app/app.service';
import { Op } from 'sequelize';
import db from '../../database/models';
import claimsScripts from '../../database/scripts/claims.scripts';
import ffsHelpers from './ffs.helpers';
import { firstDayOfLastMonth, months } from '../../utils/timers';

export default class FFSService extends AppService {
  constructor({ body, files, query, params }) {
    super({ body, files, query, params });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
  }

  async getFFSMonthlyPaymentsSvc() {
    const { rows, totals } = await this.$fetchFFSMonthlyPaymentByHcps();
    const { id: mfpId } = await db.MonthlyFFSPayment.updateCurrentMonthRecord(
      totals
    );
    db.HcpMonthlyFFSPayment.updateCurrentMonthRecords(rows, mfpId);
    return db.MonthlyFFSPayment.findAndCountAll({
      ...this.paginate(),
    });
  }
  async getFFSMonthlyHcpBreakdownSvc() {
    const { mfpId } = this.params;
    // const { totalSelectedAmt } = await this.handlePreselection(mfpId);
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
      totalActualAmt: monthlySum.totalActualAmt,
      totalActualClaims: monthlySum.totalActualClaims,
      totalSelectedAmt: monthlySum.totalSelectedAmt,
      totalSelectedClaims: monthlySum.totalSelectedClaims,
    };
  }

  async requestAuditSvc() {
    const { mfpId } = this.params;
    const { selectedHcpIds } = this.body;

    const [_, updatedRecords] = await db.HcpMonthlyFFSPayment.update(
      { auditRequestDate: new Date() },
      { where: { mfpId, hcpId: selectedHcpIds }, returning: true }
    );
    const totals = updatedRecords.reduce(
      (acc, record) => {
        acc.selectedAmt += Number(record.amount);
        acc.selectedClaims += Number(record.totalClaims);
        return acc;
      },
      {
        selectedAmt: 0,
        selectedClaims: 0,
      }
    );
    const [__, data] = await db.MonthlyFFSPayment.update(
      {
        totalSelectedAmt: totals.selectedAmt,
        totalSelectedClaims: totals.selectedClaims,
        auditRequestDate: new Date(),
      },
      { where: { id: mfpId }, returning: true }
    );
    return data[0];
  }

  async getPaymentAdviceSvc() {
    const { date = new Date() } = this.query;
    const month = new Date(months.firstDay(date));

    const data = await db.HcpMonthlyFFSPayment.findAndCountAll({
      where: { auditRequestDate: { [Op.not]: null } },
      ...this.paginate(),
      include: [
        {
          model: db.MonthlyFFSPayment,
          as: 'monthlyFFSPayment',
          where: { month },
          attributes: [],
        },
        {
          model: db.HealthCareProvider,
          as: 'hcp',
          attributes: ['code', 'name', 'state'],
        },
      ],
    });
    return { count: data.count, data: this.groupFFSByHcpState(data.rows) };
  }

  async $fetchFFSMonthlyPaymentByHcps() {
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
    const totalSelectedAmt = updatedRecords.reduce((acc, record) => {
      acc += Number(record.amount);
      return acc;
    }, 0);
    db.MonthlyFFSPayment.update({ totalSelectedAmt }, { where: { id: mfpId } });

    return { totalSelectedAmt, updatedRecords };
  }

  $fetchAllByMfpId(mfpId) {
    return db.HcpMonthlyFFSPayment.findAll({
      where: { mfpId },
    });
  }
}

Object.assign(FFSService.prototype, ffsHelpers);
