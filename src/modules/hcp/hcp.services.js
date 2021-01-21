import db from '../../database/models';
import AppService from '../app/app.service';

export default class HcpService extends AppService {
  constructor({ body, files, query, params }) {
    super({ body, files, query, params });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
  }

  async fetchAllHcp() {
    return await db.HealthCareProvider.findAndCountAll({
      where: { ...this.filterBy(['code', 'name']) },
      order: [['createdAt', 'DESC']],
      ...this.paginate(),
    });
  }
}
