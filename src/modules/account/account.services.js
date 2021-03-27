/* eslint-disable indent */
import AppService from '../app/app.service';
import db from '../../database/models';
import { months } from '../../utils/timers';
// import { Op } from 'sequelize';
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

  fetchPaymentConfirmation() {
    const { date } = this.query;
    return db.HcpMonthlyCapitation.findAndCountAll({
      where: { month: new Date(months.firstDay(date)) },
      ...this.paginate(this.query),
      include: {
        model: db.HealthCareProvider,
        as: 'hcp',
        attributes: ['name', 'code', 'bank', 'accountNumber', 'state'],
      },
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
