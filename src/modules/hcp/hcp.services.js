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
import { CONTROL_HCPs_ARRAY } from '../../database/scripts/helpers.scripts';

const { sequelize } = db;

export default class HcpService extends AppService {
  constructor({ body, files, query, params, user: operator }) {
    super({ body, files, query, params, operator });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
    this.operator = operator;
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
      const { specialtyIds } = this.body;
      await this.validateIdArr('Specialty', specialtyIds);
      await hcp.addSpecialties(specialtyIds, trnx);
      const defaultPass = await this.createDefaultPassword(
        { hcpId: hcp.id },
        trnx
      );
      const result = hcp.dataValues;
      result.defaultPassword = returnPassword && defaultPass;
      !returnPassword && (await this.sendPassword(hcp.email, defaultPass));
      this.record(`Created a new HCP (hcpCode: ${hcp.code})`);
      await t.commit();
      return db.HealthCareProvider.findOne({
        where: { id: hcp.id },
        include: { ...this.specialtyModel(db) },
      });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async updateHcpInfo() {
    const t = await sequelize.transaction();
    try {
      const trnx = { transaction: t };
      const hcpId = Number(this.params.hcpId);
      const { specialtyIds } = this.body;
      await this.validateUnique(['code', 'email'], {
        model: db.HealthCareProvider,
        reqBody: this.body,
        resourceType: 'HCP',
        resourceId: hcpId,
      });
      if (specialtyIds) {
        await this.updateHcpSpecialties(specialtyIds, trnx);
      }
      const results = await db.HealthCareProvider.update(this.body, {
        where: { id: hcpId },
        returning: true,
        ...trnx,
      });
      this.rejectIf(!results[1][0], {
        withError: `No hcp matches the id of ${hcpId}`,
        status: 404,
      });
      this.record(
        `Updated the details of a HCP (hcpCode: ${results[1][0].code})`
      );
      await t.commit();
      return this.findHpcById(hcpId);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async updateHcpSpecialties(specialtyIds, trnx) {
    const hcpId = Number(this.params.hcpId);
    const promiseArr = specialtyIds.map((specialtyId) =>
      db.HcpSpecialty.create({ hcpId, specialtyId }, trnx)
    );
    await db.HcpSpecialty.destroy({ where: { hcpId }, ...trnx });
    await Promise.all(promiseArr);
    return true;
  }

  findHpcById(hcpId) {
    return db.HealthCareProvider.findOne({
      where: { id: hcpId },
      include: { ...this.specialtyModel(db) },
    });
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
      include: { ...this.specialtyModel(db) },
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
    const controlHcps = await db.HealthCareProvider.findAll({
      where: { code: { [Op.in]: CONTROL_HCPs_ARRAY } },
    });
    const controlHcpIds = controlHcps.map((hcp) => hcp.id);
    const data1 = await this.$getSameHcpFamilies({
      hcpId,
      controlHcpIds,
      date,
    });
    const data2 = await this.$getDifferentHcpFamilies({
      hcpId,
      controlHcpIds,
      date,
    });
    const data = { count: 0, rows: [], hcp: null };
    data.count = data1.count + data2.count;
    data.rows = data.rows.concat(data1.rows, data2.rows);
    data.hcp = await db.HealthCareProvider.findOne({ where: { id: hcpId } });
    return data;
  }

  $getSameHcpFamilies({ hcpId, controlHcpIds, date }) {
    return db.Enrollee.findAndCountAll({
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
        'hcpId',
      ],
      include: {
        model: db.Enrollee,
        as: 'dependants',
        required: false,
        where: {
          [Op.and]: [{ hcpId: { [Op.notIn]: controlHcpIds } }, { hcpId }],
          isVerified: true,
          dateVerified: {
            [Op.lte]: new Date(
              moment(date).clone().endOf('month').format('YYYY-MM-DD')
            ),
          },
        },
        attributes: [
          ['relationshipToPrincipal', 'Member'],
          ['surname', 'Family Name'],
          ['firstName', 'Other Name'],
          ['dateOfBirth', 'Date Of Birth'],
          ['gender', 'Sex'],
          'scheme',
          'hcpId',
        ],
      },
    });
  }
  async $getDifferentHcpFamilies({ hcpId, controlHcpIds, date }) {
    const data = await db.Enrollee.findAndCountAll({
      where: {
        hcpId: { [Op.not]: hcpId },
        principalId: null,
        // isVerified: true,
        // dateVerified: {
        //   [Op.lte]: new Date(
        //     moment(date).clone().endOf('month').format('YYYY-MM-DD')
        //   ),
        // },
      },
      order: [['dateVerified', 'DESC']],
      attributes: [
        'serviceNumber',
        'staffNumber',
        ['enrolleeIdNo', 'idNumber'],
        'hcpId',
      ],
      include: {
        model: db.Enrollee,
        as: 'dependants',
        required: true,
        where: {
          [Op.and]: [{ hcpId: { [Op.notIn]: controlHcpIds } }, { hcpId }],
          isVerified: true,
          dateVerified: {
            [Op.lte]: new Date(
              moment(date).clone().endOf('month').format('YYYY-MM-DD')
            ),
          },
        },
        attributes: [
          ['relationshipToPrincipal', 'Member'],
          ['surname', 'Family Name'],
          ['firstName', 'Other Name'],
          ['dateOfBirth', 'Date Of Birth'],
          ['gender', 'Sex'],
          'scheme',
          'hcpId',
        ],
      },
    });
    return {
      count: data.count,
      rows: data.rows.map((record) => {
        record.dataValues.omitPrincipalFromManifest = true;
        return record;
      }),
    };
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
    this.record(
      `Changed the status of HCPs (IDs: ${hcpIds.join(', ')}) to ${status}`
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
    this.record(`Deleted the HCP (${hcp.code})`);
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
