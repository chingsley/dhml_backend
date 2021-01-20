import db from '../../database/models';
import AppService from '../app/app.service';

export default class HcpService extends AppService {
  constructor({ body, files, query }) {
    super({ body, files, query });
    this.body = body;
    this.files = files;
    this.query = query;
  }

  async fetchAllHcp() {
    return await db.HealthCareProvider.findAndCountAll({
      where: { ...this.filterBy(['code', 'name']) },
      ...this.paginate(),
    });
  }
}
