import db from '../../database/models';
import AppService from '../app/app.service';
import { getCapitation, getManifest } from '../../database/scripts/hcp.scripts';
import { enrolleeSearchableFields } from '../../shared/attributes/enrollee.attributes';

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
    return db.Enrollee.findAndCountAll({
      where: {
        hcpId,
        isVerified: true,
        ...this.searchEnrolleesBy(enrolleeSearchableFields),
      },
      ...this.paginate(),
      order: [['dateVerified', 'DESC']],
      include: {
        model: db.HealthCareProvider,
        as: 'hcp',
      },
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

  async toggleStatusOfHcp() {
    const { hcpId } = this.params;
    const hcp = await this.findOneRecord({
      modelName: 'HealthCareProvider',
      where: { id: hcpId },
      isRequired: true,
      errorIfNotFound: `No HCP matches an id of ${hcpId}`,
    });
    if (hcp.status === 'active') {
      await hcp.update({ status: 'suspended' });
    } else {
      await hcp.update({ status: 'active' });
    }
    await hcp.reload();
    return hcp;
  }
  async handleHcpDelete() {
    // const { hcpId } = this.params;
    // const hcp = await this.findOneRecord({
    //   modelName: 'HealthCareProvider',
    //   where: { id: hcpId },
    //   isRequired: true,
    //   errorIfNotFound: `No HCP matches the Id of ${hcpId}`,
    //   include: { model: db.Enrollee, as: 'enrollees' },
    // });
    // // await hcp.destroy();
    // return hcp;
    return { message: 'work in progress....' };
  }
}
