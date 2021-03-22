import AppService from '../app/app.service';
import db from '../../database/models';
// import { Op } from 'sequelize';
// import { months } from '../../utils/timers';

export default class ReportService extends AppService {
  constructor({ body, files, query, params }) {
    super({ body, files, query, params });
    this.reqBody = body;
    this.files = files;
    this.query = query;
    this.params = params;
  }

  async getAllCapitationApprovals() {
    await this.updateCapSumTable();
    return db.MonthlyCapitationSum.findAndCountAll({
      // where: { month: { [Op.lt]: months.currentMonth } },
      order: [['month', 'DESC']],
      ...this.paginate(this.query),
    });
  }
}
