import db from '../../database/models';
import AppService from '../app/app.service';
import { getCapitation, getManifest } from '../../database/scripts/hcp.scripts';
import { enrolleeSearchableFields } from '../../shared/attributes/enrollee.attributes';
import { Op } from 'sequelize';
import { hcpSearchableFields } from '../../shared/attributes/hcp.attribtes';
import { throwError } from '../../shared/helpers';

export default class HcpService extends AppService {
  constructor({ body, files, query, params }) {
    super({ body, files, query, params });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
  }

  async createHcp() {
    await this.validateUnique(['code', 'email'], {
      model: db.HealthCareProvider,
      reqBody: this.body,
      resourceType: 'HCP',
    });
    return await db.HealthCareProvider.create(this.body);
  }

  async fetchAllHcp() {
    return await db.HealthCareProvider.findAndCountAll({
      where: {
        ...this.searchHcpBy(hcpSearchableFields),
        ...this.filterHcp(),
      },
      order: [['id', 'ASC']],
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
  filterHcp() {
    return this.filterBy(
      ['hcpCode', 'hcpName', 'category', 'state', 'status'],
      {
        map: {
          hcpCode: 'code',
          hcpName: 'name',
        },
      }
    );
  }

  async suspendOrActivate() {
    const { status, enrolleeIds } = this.body;
    const result = await db.HealthCareProvider.update(
      { status },
      { where: { id: enrolleeIds }, returning: true }
    );
    return result[1];
  }
  async handleHcpDelete() {
    const hcp = await this.findByParmas();
    if (hcp.enrollees.lenght > 0) {
      throwError({
        status: 400,
        error: 'cannot delete hcp with enrolleess',
      });
    }
    await hcp.destroy();
    return hcp;
  }
  searchHcpBy = (searchableFields) => {
    const { searchField, searchValue, searchItem } = this.query;
    const allowedFields = searchableFields.map(({ name }) => name);
    let conditions = {};
    if (searchField && searchValue && allowedFields.includes(searchField)) {
      conditions = {
        [searchField]: { [Op.iLike]: searchValue.toLowerCase() },
      };
    }
    if (searchItem) {
      conditions = {
        ...conditions,
        ...{
          [Op.or]: searchableFields.map((field) => {
            if (field.type === 'string') {
              return {
                [field.name]: { [Op.iLike]: `%${searchItem.toLowerCase()}%` },
              };
            } else {
              return {};
            }
          }),
        },
      };
    }
    const { log } = console;
    log('searchEnrolleesBy ===> ', conditions);
    return conditions;
  };

  async findByParmas() {
    const { hcpId } = this.params;
    const hcp = await this.findOneRecord({
      modelName: 'HealthCareProvider',
      where: { id: hcpId },
      isRequired: true,
      errorIfNotFound: `No HCP matches the Id of ${hcpId}`,
      include: { model: db.Enrollee, as: 'enrollees' },
    });
    return hcp;
  }
}
