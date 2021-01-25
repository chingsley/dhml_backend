import db from '../../database/models';
import AppService from '../app/app.service';
import { getManifest } from '../../database/scripts/hcp.scripts';

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
    const { page, pageSize } = this.query;
    let count, rows;
    if (page && pageSize) {
      count = (await this.executeQuery(getManifest)).length;
      rows = await this.executeQuery(getManifest, this.query);
    } else {
      rows = await this.executeQuery(getManifest, this.query);
      count = rows.length;
    }
    return { count, rows };
    // return await db.HealthCareProvider.findAndCountAll({
    //   where: { ...this.filterHcp() },
    //   include: {
    //     model: db.Enrollee,
    //     as: 'enrollees',
    //     where: { principalId: null },
    //     include: { model: db.Enrollee, as: 'dependants' },
    //   },
    //   ...this.paginate(),
    // });
  }
  async filterHcp() {
    return this.filterBy(['hcpCode', 'hcpName'], {
      map: {
        hcpCode: 'code',
        hcpName: 'name',
      },
    });
  }
}
