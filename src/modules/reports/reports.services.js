/* eslint-disable indent */
import AppService from '../app/app.service';
import db from '../../database/models';
import { Op } from 'sequelize';
import ROLES from '../../shared/constants/roles.constants';

export default class ReportService extends AppService {
  constructor({ body, files, query, params }) {
    super({ body, files, query, params });
    this.reqBody = body;
    this.files = files;
    this.query = query;
    this.params = params;
  }

  async getAllCapitationApprovals(userRole) {
    const filter =
      userRole === ROLES.MD
        ? {}
        : {
            dateApproved: { [Op.not]: null },
          };

    await this.updateCapSumTable();
    return db.MonthlyCapitationSum.findAndCountAll({
      where: { ...filter },
      order: [['month', 'DESC']],
      ...this.paginate(this.query),
    });
  }
}
