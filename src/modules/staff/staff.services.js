import { QueryTypes } from 'sequelize';
import db from '../../database/models';
import { getUnregisteredStaffs } from '../../database/scripts/staff.scripts';
import { queryAttributes } from '../../shared/attributes/staff.attributes';
import AppService from '../app/app.service';

export default class StaffService extends AppService {
  constructor({ body, files, query, params }) {
    super({ body, files, query, params });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
  }

  async fetchAllStaff() {
    const { unregisteredOnly } = this.query;
    if (unregisteredOnly && JSON.parse(unregisteredOnly.toLowerCase())) {
      const { dialect, database } = db.sequelize.options;
      return await db.sequelize.query(
        getUnregisteredStaffs(dialect, database),
        {
          type: QueryTypes.SELECT,
        }
      );
    } else {
      return await db.Staff.findAndCountAll({
        where: {
          ...this.filterBy(queryAttributes),
          ...this.exactMatch(['staffIdNo']),
        },
        order: [['createdAt', 'DESC']],
        ...this.paginate(),
      });
    }
  }
}
