/* eslint-disable indent */
import AppService from '../app/app.service';
import db from '../../database/models';
import { months, dateInWords, delayInSeconds } from '../../utils/timers';
import { Op } from 'sequelize';
import { downloadPaymentAdvice } from '../../utils/pdf/generatePaymentAdvicePdf';
import send_email_report from '../../utils/pdf/sendPaymentAdvice';

export default class AccountService extends AppService {
  constructor({ body, files, query, params }) {
    super({ body, files, query, params });
    this.reqBody = body;
    this.files = files;
    this.query = query;
    this.params = params;
  }

  async getMonthSpecificCaps() {
    const { date } = this.query;
    const hcpCapitations = await db.HcpMonthlyCapitation.findAll({
      where: { month: new Date(months.firstDay(date)) },
      include: [
        {
          model: db.HealthCareProvider,
          as: 'hcp',
          attributes: { exclude: ['createdAt', 'updatedAt', 'roleId'] },
        },
        {
          model: db.GeneralMonthlyCapitation,
          as: 'generalMonthlyCapitation',
          attributes: ['dateApproved', 'datePaid'],
        },
      ],
    });

    this.rejectIf(hcpCapitations.length < 1, {
      withError: `There's no approved capitation for ${dateInWords(date)}`,
    });
    return this.groupByState(hcpCapitations);
  }

  async sendHcpMonthlyPaymentAdvice() {
    const { hcpMonthCapId: id } = this.params;
    const hcpMonthlyPaymentAdvice = await db.HcpMonthlyCapitation.findOne({
      where: { id },
      include: [
        {
          model: db.HealthCareProvider,
          as: 'hcp',
          attributes: { exclude: ['createdAt', 'updatedAt', 'roleId'] },
        },
        {
          model: db.GeneralMonthlyCapitation,
          as: 'generalMonthlyCapitation',
          attributes: { exclude: ['createdAt', 'updatedAt'] },
          where: { datePaid: { [Op.not]: null } },
        },
      ],
    });
    this.rejectIf(!hcpMonthlyPaymentAdvice, {
      withError: `No paid capitation was found for the id of ${id}. Please confirm that the id is correct and that the capitation has been paid`,
    });
    const hmpa = hcpMonthlyPaymentAdvice;
    hmpa.hcp.mustHaveEmail();
    const { amount } = hmpa;
    const {
      name: hcpName,
      bank: bankName,
      accountNumber,
      armOfService,
      email,
    } = hmpa.hcp;
    //----------------------------------------
    // Todo: throw error if hcp has no email
    //----------------------------------------
    const { datePaid } = hmpa.generalMonthlyCapitation;
    const forPeriod = hmpa.generalMonthlyCapitation.monthInWords;

    const fileName = 'payment_advice';
    const pdf = await downloadPaymentAdvice(
      {
        subheader: 'PAYMENT ADVICE - CAPITATION',
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
      subject: `Payment Advice, Capitation ${forPeriod}`,
      email,
      pathToAttachment: `${process.cwd()}/${pdf}`,
      fileName,
      fileType: 'application/pdf',
      forPeriod,
    });
    return hmpa;
  }

  async updateTsaRemita() {
    const { capitationId: id } = this.params;
    const capitation = await this.findOneRecord({
      modelName: 'HcpMonthlyCapitation',
      where: { id },
      errorIfNotFound: 'no capitation record matches the supplied id value',
    });
    await capitation.update(this.body);
    return capitation;
  }

  async fetchPaymentConfirmation() {
    const { date } = this.query;
    const data = await db.HcpMonthlyCapitation.findAndCountAll({
      where: { month: new Date(months.firstDay(date)) },
      ...this.paginate(this.query),
      include: {
        model: db.HealthCareProvider,
        as: 'hcp',
        attributes: { exclude: ['createdAt', 'updatedAt'] },
      },
    });
    this.throwErrorIf(data.count === 0, {
      withMessage: `No records found for the selected month, please confirm that the capitation for ${dateInWords(
        date
      )} has been approved.`,
    });
    return {
      ...data,
      total: this.sumUp(data.rows, ['lives', 'amount']),
    };
  }

  async fetchNhisReport() {
    const { date } = this.query;
    const data = await db.HcpMonthlyCapitation.findAndCountAll({
      where: { month: new Date(months.firstDay(date)) },
      ...this.paginate(this.query),
      include: [
        {
          model: db.GeneralMonthlyCapitation,
          as: 'generalMonthlyCapitation',
          attributes: ['datePaid'],
          where: { datePaid: { [Op.not]: null } },
        },
        {
          model: db.HealthCareProvider,
          as: 'hcp',
          attributes: ['name', 'code', 'bank', 'accountNumber', 'state'],
        },
      ],
    });
    this.throwErrorIf(data.count === 0, {
      withMessage: `No records found for the selected month. Please confirm that the capitation for ${dateInWords(
        date
      )} has been paid.`,
    });
    return {
      ...data,
      total: this.sumUp(data.rows, ['lives', 'amount']),
    };
  }

  async upsertCapitationVoucher() {
    const t = await db.sequelize.transaction();
    try {
      // eslint-disable-next-line no-unused-vars
      const capSum = await this.getCapSumById(this.reqBody.gmcId, {
        rejectCurrentMonth: true,
      });
      const voucher = await db.Voucher.updateOrCreate(this.reqBody, t);

      /**
       * this operation is currently done at the point of "auditing..."
       */
      // await db.HcpMonthlyCapitation.addMonthlyRecord(capSum, t);
      await t.commit();
      return voucher;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  findVoucherById() {
    return this.findOneRecord({
      modelName: 'Voucher',
      where: { id: this.params.voucherId },
      include: { model: db.GeneralMonthlyCapitation, as: 'capitation' },
      errorIfNotFound: `No Voucher matches the id of ${this.params.voucherId}`,
    });
  }

  groupByState(capitation) {
    return capitation.reduce((acc, cap) => {
      if (!acc[cap.hcp.state]) {
        acc[cap.hcp.state] = [cap];
      } else {
        acc[cap.hcp.state].push(cap);
      }
      return acc;
    }, {});
  }
}
