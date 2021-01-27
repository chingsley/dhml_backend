import db from '../../database/models';
import AppService from '../app/app.service';
import { getCapitation, getManifest } from '../../database/scripts/hcp.scripts';

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
  async fetchVerifiedHcpEnrollees() {
    const { hcpId } = this.params;
    const { field, value } = this.query;
    if (!field && value) {
      let result = await this.queryVerifiedEnrollees(hcpId, ['Enrollee']);
      if (!result.rows[0]) {
        result = await this.queryVerifiedEnrollees(hcpId, [
          'HealthCareProvider',
        ]);
      }
      return result;
    }
    return await this.queryVerifiedEnrollees(hcpId, [
      'Enrollee',
      'HealthCareProvider',
    ]);
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
  async fetchCapitation() {
    const { page, pageSize } = this.query;
    let count, rows;
    if (page && pageSize) {
      count = (await this.executeQuery(getCapitation)).length;
      rows = await this.executeQuery(getCapitation, this.query);
    } else {
      rows = await this.executeQuery(getCapitation, this.query);
      count = rows.length;
    }
    return { count, rows };
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
