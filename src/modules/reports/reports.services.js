/* eslint-disable indent */
import AppService from '../app/app.service';
import db from '../../database/models';
import { Op } from 'sequelize';
import ROLES from '../../shared/constants/roles.constants';
import { capitationByArmOfService } from '../../database/scripts/analysis.scripts';
import { AUDIT_STATUS } from '../../shared/constants/lists.constants';
import reportHelpers from './reports.helpers';

export default class ReportService extends AppService {
  constructor({ body, files, query, params, user: operator }) {
    super({ body, files, query, params, operator });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
    this.operator = operator;
  }

  async getGeneralMonthlyCap(userRole) {
    const filter = (model, userRole) => {
      if (model === 'GeneralMonthlyCapitation' && userRole === ROLES.MD) {
        return { auditStatus: AUDIT_STATUS.auditPass };
      } else if (model === 'Voucher' && userRole === ROLES.HOD_AUDIT) {
        return { where: { id: { [Op.not]: null } } };
      } else {
        return {};
      }
    };
    await db.GeneralMonthlyCapitation.updateRecords();
    return db.GeneralMonthlyCapitation.findAndCountAll({
      where: { ...filter('GeneralMonthlyCapitation', userRole) },
      order: [['month', 'DESC']],
      ...this.paginate(this.query),
      include: [
        {
          model: db.Voucher,
          as: 'voucher',
          ...filter('Voucher', userRole),
          attributes: ['id', ['createdAt', 'auditRequestedOn']],
        },
      ],
    });
  }

  async auditMonthlyCapSum() {
    const t = await db.sequelize.transaction();
    const { auditPass, pending } = AUDIT_STATUS;
    const capSum = await this.getCapSumById(this.params.summaryId);
    this.rejectIf(!capSum.voucher, {
      withError: 'This captitation has not been marked ready for audit.',
    });
    this.rejectIf(capSum.isApproved, {
      // to avoid having an "approved" capitation with audit status "flagged" or "pending".
      withError: 'Cannot change audit status, capitation has been approved.',
    });
    const { auditStatus } = this.body;
    const dateAudited = auditStatus === pending ? null : new Date();
    try {
      if (auditStatus === auditPass) {
        await capSum.update(
          { ...this.body, flagReason: null, dateAudited },
          { transaction: t }
        );
        await db.HcpMonthlyCapitation.addMonthlyRecord(capSum, t);
      } else {
        await capSum.update({ ...this.body, dateAudited }, { transaction: t });
        await db.HcpMonthlyCapitation.deleteMonthRecord(capSum, t);
      }
      this.record(
        `audited ${capSum.monthInWords} capitation. (Audit status: ${auditStatus})`
      );
      await t.commit();
      return capSum;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async approveMonthlyCapSum() {
    const capSum = await this.getCapSumById(this.params.summaryId, {
      rejectCurrentMonth: true,
    });
    this.rejectIf(capSum.auditStatus !== AUDIT_STATUS.auditPass, {
      withError: 'Cannot approve. Capitation has not passed audit.',
    });
    this.rejectIf(capSum.isPaid, {
      withError: 'Cannot change approval, capitation has been paid.',
    });
    const { approve } = this.body;
    const dateApproved = approve ? new Date() : null;
    await capSum.update({ dateApproved });
    const logAction = approve ? 'Approved' : 'Cancled approval for';
    this.record(`${logAction} ${capSum.monthInWords} capitation`);
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
    this.rejectIf(capSum.isPaid, {
      withError: `${capSum.monthInWords} has already been marked as paid`,
    });
    await capSum.update({ datePaid: new Date() });
    this.record(`Marked ${capSum.monthInWords} capitation as "paid"`);
    return capSum;
  }

  async getCapByArmOfService() {
    const data = await this.executeQuery(capitationByArmOfService, this.query);
    return this.analysisFormatter.summarized(data, this.query);
  }
}

Object.assign(ReportService.prototype, reportHelpers);
