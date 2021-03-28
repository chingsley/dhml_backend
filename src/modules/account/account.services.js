/* eslint-disable indent */
import AppService from '../app/app.service';
import db from '../../database/models';
import { months, moment } from '../../utils/timers';
import { Op } from 'sequelize';
// import ROLES from '../../shared/constants/roles.constants';
// import { throwError } from '../../shared/helpers';

// const { sequelize } = db;

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
      include: {
        model: db.HealthCareProvider,
        as: 'hcp',
        attributes: ['code', 'name', 'accountNumber', 'state'],
      },
    });
    return this.groupByState(hcpCapitations);
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
        attributes: ['name', 'code', 'bank', 'accountNumber', 'state'],
      },
    });
    const dateInWords = moment(date).format('MMMM YYYY');
    this.throwErrorIf(data.count === 0, {
      withMessage: `No records found for the selected month, please confirm that the capitation for ${dateInWords} has been approved.`,
    });
    return data;
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
    const dateInWords = moment(date).format('MMMM YYYY');
    this.throwErrorIf(data.count === 0, {
      withMessage: `No records found for the selected month, please confirm that the capitation for ${dateInWords} has been approved and paid for`,
    });
    return data;
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
