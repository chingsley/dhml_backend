import { Op } from 'sequelize';
import { delayInSeconds, moment } from '../../utils/timers';
import { downloadPaymentAdvice } from '../../utils/pdf/generatePaymentAdvicePdf';
import send_email_report from '../../utils/pdf/sendPaymentAdvice';
import db from '../../database/models';
import AppService from '../app/app.service';
import claimsScripts from '../../database/scripts/claims.scripts';
import ffsHelpers from './ffs.helpers';
import { months } from '../../utils/timers';
import ffsScripts from '../../database/scripts/ffsreports.scripts';
import ROLES from '../../shared/constants/roles.constants';
import {
  AUDIT_STATUS,
  PAY_ACTIONS,
} from '../../shared/constants/lists.constants';
import analysisScripts from '../../database/scripts/analysis.scripts';

export default class FFSService extends AppService {
  constructor({ body, files, query, params, user: operator }) {
    super({ body, files, query, params });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
    this.operator = operator;
  }

  async getFFSMonthlyPaymentsSvc() {
    const { rows, totals } = await this.$fetchFFSMonthlyPaymentByHcps();
    const { id: mfpId } = await db.MonthlyFFSPayment.updateCurrentMonthRecord(
      totals
    );
    db.HcpMonthlyFFSPayment.updateCurrentMonthRecords(rows, mfpId);

    const operatorRole = this.operator.role.title;
    const filters = {
      [ROLES.HOD_AUDIT]: { auditRequestDate: { [Op.not]: null } },
    };
    return db.MonthlyFFSPayment.findAndCountAll({
      where: filters[operatorRole] || {},
      ...this.paginate(),
    });
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
      totalActualAmt: monthlySum.totalActualAmt,
      totalActualClaims: monthlySum.totalActualClaims,
      totalSelectedAmt: monthlySum.totalSelectedAmt,
      totalSelectedClaims: monthlySum.totalSelectedClaims,
      status: {
        isCurrentMonth: monthlySum.isCurrentMonth,
        isApproved: monthlySum.isApproved,
        isPaid: monthlySum.isPaid,
      },
    };
  }

  async requestAuditSvc() {
    const { mfpId } = this.params;
    const monthlyFFS = await this.$findMonthlyFFSById(mfpId);
    monthlyFFS.rejectIfRecordHasPassedAudit();
    monthlyFFS.rejectCurrentMonth();
    await monthlyFFS.checkPendingMonths();

    const { selectedHcpIds, ...voucherData } = this.body;
    db.FFSVoucher.updateOrCreate(mfpId, voucherData);
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

  async getFFSVoucherByMfpIdSvc() {
    const { mfpId } = this.params;
    const data = await this.findOneRecord({
      modelName: 'FFSVoucher',
      where: { mfpId },
      errorIfNotFound: `No ffs voucher found for the mfpId: ${mfpId}`,
      include: {
        model: db.MonthlyFFSPayment,
        as: 'monthlyFFS',
      },
    });
    return data;
  }

  async updateFFSTsaRemita() {
    const { hcpmfpId: id } = this.params;
    const hcpMonthlyFSS = await this.findOneRecord({
      modelName: 'HcpMonthlyFFSPayment',
      where: { id },
      errorIfNotFound: `no record matches the hcpmfpId: ${id}`,
    });
    await hcpMonthlyFSS.update(this.body);
    return hcpMonthlyFSS;
  }

  async handleFFSAudit() {
    const { mfpId } = this.params;
    const statusUpdate = this.body;
    const monthlyFFS = await this.$findMonthlyFFSById(mfpId);
    monthlyFFS.rejectIfNotReadyForAudit();
    monthlyFFS.rejectIfApproved();

    await monthlyFFS.update({ ...statusUpdate, dateAudited: new Date() });
    return monthlyFFS;
  }

  async handleFFSApproval() {
    const { mfpId } = this.params;
    const monthlyFFS = await this.$findMonthlyFFSById(mfpId);
    monthlyFFS.rejectIfNotAuditPass();
    monthlyFFS.rejectIfPaid();
    const { approve } = this.body;
    const dateApproved = approve ? new Date() : null;
    await monthlyFFS.update({ dateApproved });
    return monthlyFFS;
  }

  async markPaidFFS() {
    const t = await db.sequelize.transaction();
    try {
      const { mfpId } = this.params;
      const monthlyFFS = await this.$findMonthlyFFSById(mfpId, {
        include: {
          model: db.HcpMonthlyFFSPayment,
          as: 'hcpMonthlyFFSPayments',
          where: { auditRequestDate: { [Op.not]: null } },
          required: false,
        },
      });

      monthlyFFS.rejectIfNotApproved();

      const { hcpMonthlyFFSPayments, monthInWords } = monthlyFFS;
      const hcpIds = hcpMonthlyFFSPayments.map((obj) => obj.hcpId);
      this.rejectIf(hcpIds.length < 1, {
        withError: `No HCPs have been selected for ${monthInWords} payment`,
      });

      let datePaid = new Date();
      let script = claimsScripts.markPaidRefcodes;

      const { action } = this.body;
      if (action === PAY_ACTIONS.CANCEL_PAY) {
        datePaid = null;
        script = claimsScripts.undoMarkedPaidRefcodes;
      }

      await monthlyFFS.update({ datePaid }, { transaction: t });
      await this.executeQuery(script, {
        date: monthlyFFS.month,
        hcpIds,
      });
      await t.commit();
      return monthlyFFS;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async selectedFFSBreakdownByHcpSvc() {
    const { date = new Date(), groupByState = false } = this.query;
    const month = new Date(months.firstDay(date));

    const data = await db.HcpMonthlyFFSPayment.findAndCountAll({
      where: { auditRequestDate: { [Op.not]: null } },
      ...this.paginate(),
      include: [
        {
          model: db.MonthlyFFSPayment,
          as: 'monthlyFFSPayment',
          where: { month },
          attributes: ['month'],
        },
        {
          model: db.HealthCareProvider,
          as: 'hcp',
          attributes: ['code', 'name', 'state', 'accountNumber', 'email'],
        },
      ],
    });
    return groupByState
      ? { count: data.count, data: this.groupFFSByHcpState(data.rows) }
      : data;
  }

  async getFFSNhisReportByMonthSvc() {
    const script = ffsScripts.ffsNhisReport;
    return this.getPaginatedData(script, this.query);
  }

  async analyseFFSByArmOfService() {
    const script = analysisScripts.ffsReports;
    const data = await this.executeQuery(script, this.query);
    return this.analysisFormatter.summarized(data, this.query);
  }

  async sendFFSPaymentAdviceSVC() {
    const { hcpmfpId: id } = this.params;
    const hcpMonthlyFFSPayment = await this.findOneRecord({
      modelName: 'HcpMonthlyFFSPayment',
      where: { id },
      errorIfNotFound: `No "Paid" hcpMonthlyFFSPayment matches the id of ${id}. Please confirm that the id is correct and that the ffs has been paid`,
      include: [
        {
          model: db.HealthCareProvider,
          as: 'hcp',
          attributes: { exclude: ['createdAt', 'updatedAt', 'roleId'] },
        },
        {
          model: db.MonthlyFFSPayment,
          as: 'monthlyFFSPayment',
          where: { datePaid: { [Op.not]: null } },
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
      ],
    });

    const hcp = hcpMonthlyFFSPayment.hcp;
    hcp.mustHaveEmail();

    const { amount } = hcpMonthlyFFSPayment;
    const {
      name: hcpName,
      bank: bankName,
      accountNumber,
      armOfService,
      email,
    } = hcp;

    const { datePaid } = hcpMonthlyFFSPayment.monthlyFFSPayment;
    const forPeriod = hcpMonthlyFFSPayment.monthlyFFSPayment.monthInWords;
    const fileName = 'ffs_payment_advice';
    const pdf = await downloadPaymentAdvice(
      {
        subheader: 'PAYMENT ADVICE - FEE FOR SERVICE',
        forPeriod,
        datePaid,
        hcpName,
        bankName,
        accountNumber,
        armOfService,
        amount,
      },
      `${fileName}.pdf`
    );
    await delayInSeconds(3);
    await send_email_report({
      subject: `Payment Advice, FFS ${forPeriod}`,
      email,
      pathToAttachment: `${process.cwd()}/${pdf}`,
      fileName,
      fileType: 'application/pdf',
      forPeriod,
    });
    return hcpMonthlyFFSPayment;
  }

  $findMonthlyFFSById(mfpId, includeOptions = {}) {
    return this.findOneRecord({
      modelName: 'MonthlyFFSPayment',
      where: { id: mfpId },
      errorIfNotFound: `No record found for mfpId: ${mfpId}`,
      ...includeOptions,
    });
  }

  $fetchAllByMfpId(mfpId) {
    return db.HcpMonthlyFFSPayment.findAll({
      where: { mfpId },
    });
  }
}

Object.assign(FFSService.prototype, ffsHelpers);
