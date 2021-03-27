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
    });
    return hcpCapitations;
  }
}
