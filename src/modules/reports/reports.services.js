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
    const { summaryId: id } = this.params;
    const { approve } = this.body;
    const dateApproved = approve ? new Date() : null;
    const capSum = await this.findOneRecord({
      modelName: 'MonthlyCapitationSum',
      where: { id },
      errorIfNotFound: `no capitation summary was found with id ${id}`,
    });
    this.validateCapSumApproval(capSum, approve);
    await capSum.update({ dateApproved });
    return capSum;
  }

  async auditMonthlyCapSum() {
    const { summaryId: id } = this.params;
    const { audited } = this.body;
    const dateAudited = audited ? new Date() : null;
    const capSum = await this.findOneRecord({
      modelName: 'MonthlyCapitationSum',
      where: { id },
      errorIfNotFound: `no capitation summary was found with id ${id}`,
    });
    this.validateCapSumAuditing(capSum, audited);
    await capSum.update({ dateAudited });
    return capSum;
  }

  async payMonthlyCapSum() {
    const { summaryId: id } = this.params;
    const capSum = await this.findOneRecord({
      modelName: 'MonthlyCapitationSum',
      where: { id },
      errorIfNotFound: `no capitation summary was found with id ${id}`,
    });
    this.validateCapSumPayment(capSum);
    await capSum.update({ datePaid: new Date() });
    return capSum;
  }

  validateCapSumApproval(capSum, approve) {
    if (capSum.isPaid && approve === false) {
      throwError({
        status: 400,
        error: ['Cannot undo approval for capitation that has been paid for'],
      });
    }
  }

  validateCapSumAuditing(capSum, audited) {
    if (capSum.isPaid && audited === false) {
      throwError({
        status: 400,
        error: ['Cannot undo audit for capitation that has been paid for'],
      });
    }
    if (!capSum.isApproved && audited === true) {
      throwError({
        status: 400,
        error: ['Cannot audit capitation before MD"s approval'],
      });
    }
  }

  validateCapSumPayment(capSum) {
    if (!capSum.isApproved) {
      throwError({
        status: 400,
        error: ['Cannot pay for capitation before MD"s approval'],
      });
    }
  }
}
