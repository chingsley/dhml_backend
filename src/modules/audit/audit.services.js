import { Op } from 'sequelize';
import db from '../../database/models';
import AppService from '../app/app.service';

export default class AuditLogService extends AppService {
  constructor({ body, files, query, params, user: operator }) {
    super({ body, files, query, params, operator });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
    this.operator = operator;
  }

  getAuditLogsService() {
    return db.AuditLog.findAndCountAll({
      where: { ...this.filterBy(['name']), ...this.$filterByDate(this.query) },
      ...this.paginate(),
    });
  }

  $filterByDate({ date }) {
    if (date) {
      const fromDate = new Date(date);
      const fromDateCopy = new Date(date);
      const toDate = new Date(fromDateCopy.setDate(fromDateCopy.getDate() + 1));
      return {
        createdAt: {
          [Op.between]: [fromDate, toDate],
        },
      };
    } else {
      return {};
    }
  }
}
