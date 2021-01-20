import db from '../../database/models';
import { queryAttributes } from '../../shared/attributes/staff.attributes';
import AppService from '../app/app.service';

export default class StaffService extends AppService {
  constructor({ body, files, query }) {
    super({ body, files, query });
    this.body = body;
    this.files = files;
    this.query = query;
  }

  async fetchAllStaff() {
    return await db.Staff.findAndCountAll({
      where: { ...this.filterBy(queryAttributes) },
      ...this.paginate(),
    });
  }
}
