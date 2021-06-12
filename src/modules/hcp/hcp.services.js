import db from '../../database/models';
import { Op } from 'sequelize';
import AppService from '../app/app.service';
import {
  getCapitationTotals,
  getManifestWithZeroStats,
  getCapitationWithoutZeroStats,
  getManifestByHcpId,
} from '../../database/scripts/hcp.scripts';
import { enrolleeSearchableFields } from '../../shared/attributes/enrollee.attributes';
import { hcpSearchableFields } from '../../shared/attributes/hcp.attribtes';
import { throwError } from '../../shared/helpers';
import { HCP } from '../../shared/constants/roles.constants';
import { months, moment } from '../../utils/timers';

const { sequelize } = db;

export default class HcpService extends AppService {
  constructor({ body, files, query, params }) {
    super({ body, files, query, params });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
  }

  async createHcp() {
    const t = await sequelize.transaction();
    try {
      const { returnPassword } = this.body;
      const trnx = { transaction: t };
      await this.validateUnique(['code', 'email'], {
        model: db.HealthCareProvider,
        reqBody: this.body,
        resourceType: 'HCP',
      });
      const hcpRole = await db.Role.findOne({ where: { title: HCP } });
      const hcp = await db.HealthCareProvider.create(
        { ...this.body, roleId: hcpRole.id },
        trnx
      );
      const defaultPass = await this.createDefaultPassword(
        { hcpId: hcp.id },
        trnx
      );
      const result = hcp.dataValues;
      result.defaultPassword = returnPassword && defaultPass;
      !returnPassword && (await this.sendPassword(hcp.email, defaultPass));
      await t.commit();
      return result;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async updateHcpInfo() {
    const hcpId = Number(this.params.hcpId);
    await this.validateUnique(['code', 'email'], {
      model: db.HealthCareProvider,
      reqBody: this.body,
      resourceType: 'HCP',
      resourceId: hcpId,
    });
    const results = await db.HealthCareProvider.update(this.body, {
      where: { id: hcpId },
      returning: true,
    });
    this.rejectIf(!results[1][0], {
      withError: `No hcp matches the id of ${hcpId}`,
      status: 404,
    });
    return results[1][0];
  }

  async fetchAllHcp() {
    return await db.HealthCareProvider.findAndCountAll({
      where: {
        ...this.searchRecordsBy(hcpSearchableFields),
        ...this.filterHcp(),
        ...this.exactMatch(['id', 'code', 'email']),
      },
      order: [['id', 'ASC']],
      ...this.paginate(),
      include: {
        model: db.Specialty,
        as: 'specialties',
        attributes: ['id', 'name'],
        through: {
          attributes: [],
        },
      },
    });
  }

  fetchHcpDropDownList() {
    return db.HealthCareProvider.findAndCountAll({
      where: {
        ...this.searchRecordsBy(hcpSearchableFields),
        ...this.filterHcp(),
        ...this.exactMatch(['id', 'code', 'email']),
        category: { [Op.iLike]: 'primary' },
      },
      attributes: ['id', 'name', 'code'],
      order: [['code', 'ASC']],
      ...this.paginate(),
    });
  }

  async fetchVerifiedHcpEnrollees(hcpId) {
    const { date = moment().format('YYYY-MM-DD') } = this.query;
    return db.Enrollee.findAndCountAll({
      where: {
        hcpId,
        isVerified: true,
        dateVerified: {
          [Op.lte]: new Date(
            moment(date).clone().endOf('month').format('YYYY-MM-DD')
          ),
        },
        ...this.searchRecordsBy(enrolleeSearchableFields),
      },
      ...this.paginate(),
      order: [['dateVerified', 'DESC']],
      include: {
        model: db.HealthCareProvider,
        as: 'hcp',
      },
    });
  }

  async downloadEnrollees() {
    const { hcpId } = this.params;
    const { date = moment().format('YYYY-MM-DD') } = this.query;
    const data = await db.Enrollee.findAndCountAll({
      where: {
        hcpId,
        principalId: null,
        isVerified: true,
        dateVerified: {
          [Op.lte]: new Date(
            moment(date).clone().endOf('month').format('YYYY-MM-DD')
          ),
        },
      },
      order: [['dateVerified', 'DESC']],
      attributes: [
        'serviceNumber',
        'staffNumber',
        ['enrolleeIdNo', 'idNumber'],
        ['surname', 'Family Name'],
        ['firstName', 'Other Name'],
        ['dateOfBirth', 'Date Of Birth'],
        ['gender', 'sex'],
        'scheme',
      ],
      include: {
        model: db.Enrollee,
        as: 'dependants',
        where: {
          isVerified: true,
          dateVerified: {
            [Op.lte]: new Date(
              moment(date).clone().endOf('month').format('YYYY-MM-DD')
            ),
          },
        },
        required: false,
        attributes: [
          ['relationshipToPrincipal', 'Member'],
          ['surname', 'Family Name'],
          ['firstName', 'Other Name'],
          ['dateOfBirth', 'Date Of Birth'],
          ['gender', 'Sex'],
          'scheme',
        ],
      },
    });
    data.hcp = await db.HealthCareProvider.findOne({ where: { id: hcpId } });
    return data;
  }

  async fetchManifest() {
    const nonPaginatedRows = await this.executeQuery(getManifestWithZeroStats, {
      ...this.query,
      pageSize: undefined,
      page: undefined,
    });
    const count = nonPaginatedRows.length;
    const total = this.summarizeManifest(nonPaginatedRows);
    const rows = await this.executeQuery(getManifestWithZeroStats, this.query);
    return { count, rows, total };
  }

  async fetchManifestByHcpId(hcpId) {
    const rows = await this.executeQuery(getManifestByHcpId, {
      ...this.query,
      hcpId,
    });
    return { count: rows.length, rows, total: this.summarizeManifest(rows) };
  }

  async fetchCapitation() {
    const nonPaginatedRows = await this.executeQuery(
      getCapitationWithoutZeroStats,
      {
        ...this.query,
        pageSize: undefined,
        page: undefined,
      }
    );
    const count = nonPaginatedRows.length;
    const rows = await this.executeQuery(
      getCapitationWithoutZeroStats,
      this.query
    );
    const [total] = await this.executeQuery(getCapitationTotals, this.query);
    const { date = months.currentMonth } = this.query;
    const monthlyCapitationSum =
      await db.GeneralMonthlyCapitation.updateAndFindOne({
        where: { month: new Date(months.firstDay(date)) },
      });
    return { count, rows, total, monthlyCapitationSum };
  }

  async fetchCapitationSummary() {
    const nonPaginatedRows = await this.executeQuery(
      getCapitationWithoutZeroStats,
      {
        ...this.query,
        pageSize: undefined,
        page: undefined,
      }
    );
    const count = nonPaginatedRows.length;
    const rows = await this.executeQuery(
      getCapitationWithoutZeroStats,
      this.query
    );
    const [total] = await this.executeQuery(getCapitationTotals, this.query);
    const capitationByState = this.groupCapitationByState(rows);

    const { date = months.currentMonth } = this.query;
    const condition = { month: new Date(months.firstDay(date)) };
    const monthlyCapitationSum =
      await db.GeneralMonthlyCapitation.updateAndFindOne({
        where: condition,
        include: { model: db.Voucher, as: 'voucher' },
      });
    return {
      count,
      data: this.sumStatsPerState(capitationByState),
      total,
      monthlyCapitationSum,
    };
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
    const { status, hcpIds } = this.body;
    const result = await db.HealthCareProvider.update(
      { status },
      { where: { id: hcpIds }, returning: true }
    );
    return result[1];
  }

  async handleHcpDelete() {
    const hcp = await this.findByParmas();
    if (hcp.enrollees.length > 0) {
      throwError({
        status: 400,
        error: ['cannot delete hcp with enrolleess'],
      });
    }
    await hcp.destroy();
    return hcp;
  }

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

  summarizeManifest(rows) {
    return rows.reduce(
      (total, record) => {
        const { principals, dependants } = record;
        total.principals += Number(principals ?? 0);
        total.dependants += Number(dependants ?? 0);
        total.lives += Number(principals ?? 0) + Number(dependants ?? 0);
        return total;
      },
      { lives: 0, principals: 0, dependants: 0 }
    );
  }

  groupCapitationByState(rows) {
    return rows.reduce((acc, record) => {
      if (acc[record.hcpState]) {
        acc[record.hcpState].push(record);
      } else {
        acc[record.hcpState] = [record];
      }
      return acc;
    }, {});
  }

  sumStatsPerState(obj) {
    return Object.entries(obj).reduce((acc1, [state, capitations]) => {
      acc1[state] = {
        rows: capitations,
        ...capitations.reduce(
          (acc2, capitation) => {
            acc2.totalAmount += Number(capitation.amount);
            acc2.totalLives += Number(capitation.lives);
            return acc2;
          },
          { totalAmount: 0, totalLives: 0 }
        ),
      };
      return acc1;
    }, {});
  }
}
