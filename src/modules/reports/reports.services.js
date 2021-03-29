/* eslint-disable indent */
import AppService from '../app/app.service';
import db from '../../database/models';
import { Op } from 'sequelize';
import ROLES from '../../shared/constants/roles.constants';
import { capitationByArmOfService } from '../../database/scripts/stats.scripts';

const { sequelize } = db;

export default class ReportService extends AppService {
  constructor({ body, files, query, params }) {
    super({ body, files, query, params });
    this.reqBody = body;
    this.files = files;
    this.query = query;
    this.params = params;
  }

  async getAllCapitationApprovals(userRole) {
    const filter =
      userRole === ROLES.MD
        ? {}
        : {
            dateApproved: { [Op.not]: null },
          };

    await db.GeneralMonthlyCapitation.updateRecords();
    return db.GeneralMonthlyCapitation.findAndCountAll({
      where: { ...filter },
      order: [['month', 'DESC']],
      ...this.paginate(this.query),
    });
  }

  async approveMonthlyCapSum() {
    const t = await sequelize.transaction();
    try {
      const capSum = await this.getCapSumById(this.params.summaryId, {
        rejectCurrentMonth: true,
      });
      this.rejectIf(capSum.isPaid, {
        withError: 'cannot change approval, capitation has been paid for',
      });
      const { approve } = this.body;
      if (approve) {
        await capSum.update({ dateApproved: new Date() }, { transaction: t });
        await db.HcpMonthlyCapitation.addMonthlyRecord(capSum, t);
      } else {
        await capSum.update({ dateApproved: null }, { transaction: t });
        await db.HcpMonthlyCapitation.deleteMonthRecord(capSum, t);
      }

      await t.commit();
      return capSum;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async auditMonthlyCapSum() {
    const capSum = await this.getCapSumById(this.params.summaryId);
    this.rejectIf(!capSum.isApproved, {
      withError: 'Cannot audit capitation before MD"s approval',
    });
    const { auditStatus } = this.body;
    const dateAudited = auditStatus === 'pending' ? null : new Date();
    await capSum.update({ ...this.body, dateAudited });
    return capSum;
  }

  /**
   * might require the use of transactions due
   * to the mail sending during payment
   * @returns updated capSum
   */
  async payMonthlyCapSum() {
    const capSum = await this.getCapSumById(this.params.summaryId);
    this.rejectIf(!capSum.isApproved, {
      withError: 'Cannot pay for capitation before MD"s approval',
    });
    await capSum.update({ datePaid: new Date() });
    return capSum;
  }

  async getCapByArmOfService() {
    const data = await this.executeQuery(capitationByArmOfService, this.query);
    return data;
  }

  async getCapSumById(id, { rejectCurrentMonth } = {}) {
    const capSum = await this.findOneRecord({
      modelName: 'GeneralMonthlyCapitation',
      where: { id },
      errorIfNotFound: `no capitation summary was found with id ${id}`,
    });
    this.rejectIf(rejectCurrentMonth && capSum.isCurrentMonth, {
      withError:
        'Operation not allowed on current running capitation until month end',
    });

    return capSum;
  }
}
