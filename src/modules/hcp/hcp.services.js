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
      where: {
        ...this.filterHcp(),
      },
      order: [['createdAt', 'DESC']],
      ...this.paginate(),
    });
  }
  async fetchManifest() {
    return await db.HealthCareProvider.findAndCountAll({
      where: { ...this.filterHcp() },
      include: {
        model: db.Enrollee,
        as: 'enrollees',
        where: { principalId: null },
        include: { model: db.Enrollee, as: 'dependants' },
      },
      ...this.paginate(),
    });
  }
  async filterHcp() {
    return this.filterBy(['hcpCode', 'hcpName'], {
      modelName: 'HealthCareProvider',
      map: {
        hcpCode: 'code',
        hcpName: 'name',
      },
    });
  }
}
