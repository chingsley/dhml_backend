/* eslint-disable indent */
import AppService from '../app/app.service';
import db from '../../database/models';
import { Op } from 'sequelize';
import ROLES from '../../shared/constants/roles.constants';
import { throwError } from '../../shared/helpers';

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

    await this.updateCapSumTable();
    return db.MonthlyCapitationSum.findAndCountAll({
      where: { ...filter },
      order: [['month', 'DESC']],
      ...this.paginate(this.query),
    });
  }
  async approveMonthlyCapSum() {
    const capSum = await this.getCapSumById(this.params.summaryId, {
      rejectCurrentMonth: true,
    });
    this.rejectIf(capSum.isPaid, {
      withError: 'cannot change approval, capitation has been paid for',
    });
    const { approve } = this.body;
    const dateApproved = approve ? new Date() : null;
    await capSum.update({ dateApproved });
    return capSum;
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

  async getCapSumById(id, { rejectCurrentMonth } = {}) {
    const capSum = await this.findOneRecord({
      modelName: 'MonthlyCapitationSum',
      where: { id },
      errorIfNotFound: `no capitation summary was found with id ${id}`,
    });

    if (rejectCurrentMonth && capSum.isCurrentMonth) {
      throwError({
        status: 400,
        error: ['Operation not allowed on current running capitation'],
      });
    }

    return capSum;
  }

  rejectIf(condition, { withError }) {
    if (condition) {
      throwError({
        status: 400,
        error: [withError],
      });
    }
  }
}
