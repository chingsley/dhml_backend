'use strict';
import { QueryTypes } from 'sequelize';
import claimsScripts from '../scripts/claims.scripts';
const { AUDIT_STATUS } = require('../../shared/constants/lists.constants');
const { rejectIf } = require('../../shared/helpers');
const { moment, days, nextMonth, months } = require('../../utils/timers');
import { v4 as uuidv4 } from 'uuid';

module.exports = (sequelize, DataTypes) => {
  const MonthlyFFSPayment = sequelize.define(
    'MonthlyFFSPayment',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      month: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      totalActualClaims: {
        type: DataTypes.INTEGER,
      },
      totalSelectedClaims: {
        type: DataTypes.INTEGER,
      },
      totalActualAmt: {
        type: DataTypes.DECIMAL,
      },
      totalSelectedAmt: {
        type: DataTypes.DECIMAL,
      },
      auditRequestDate: {
        type: DataTypes.DATE,
      },
      dateAudited: {
        type: DataTypes.DATE,
      },
      auditStatus: {
        type: DataTypes.STRING,
        defaultValue: AUDIT_STATUS.pending,
      },
      flagReason: {
        type: DataTypes.TEXT,
      },
      dateApproved: {
        type: DataTypes.DATE,
      },
      datePaid: {
        type: DataTypes.DATE,
      },
      monthInWords: {
        type: DataTypes.VIRTUAL,
        get() {
          return moment(this.month).format('MMMM YYYY');
        },
      },
      isCurrentMonth: {
        type: DataTypes.VIRTUAL,
        get() {
          return (
            moment(this.month).clone().startOf('month').format('YYYY-MM-DD') ===
            moment().clone().startOf('month').format('YYYY-MM-DD')
          );
        },
      },
      readyForAudit: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.auditRequestDate !== null;
        },
      },
      isApproved: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.dateApproved !== null;
        },
      },
      isPaid: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.datePaid !== null;
        },
      },
    },
    {}
  );
  MonthlyFFSPayment.associate = function (models) {
    MonthlyFFSPayment.hasMany(models.HcpMonthlyFFSPayment, {
      foreignKey: 'mfpId',
      as: 'hcpMonthlyFFSPayments',
    });
  };
  MonthlyFFSPayment.runScript = async function (queryFunction, reqQuery, key) {
    const { dialect, database } = sequelize.options;
    const rows = await sequelize.query(
      queryFunction(dialect, database, reqQuery),
      {
        type: QueryTypes.SELECT,
      }
    );
    if (key) {
      return { [key]: rows };
    } else {
      return rows;
    }
  };
  MonthlyFFSPayment.initializeRecords = async function () {
    const dates = await this.$getMonthsFromFirstVerifiedClaimToNow();

    const script = claimsScripts.getClaimsByHcp;
    const bulkQuery = dates.map((date) =>
      this.runScript(script, { date }, date)
    );
    const results = await Promise.all(bulkQuery);

    const { monthlyFFSPayments, hcpMontlyFFSPamyments } =
      this.$parseClaimsByHcpQueryResult(results);

    await this.bulkCreate(monthlyFFSPayments);
    this.sequelize.models.HcpMonthlyFFSPayment.bulkCreate(
      hcpMontlyFFSPamyments
    );
  };

  MonthlyFFSPayment.$getMonthsFromFirstVerifiedClaimToNow = async function () {
    const refcodeWithEarliestVerifiedClaims =
      await this.sequelize.models.ReferalCode.getRefcodeWithEarliestVerifiedClaims();
    const startMonth = months.firstDay(
      refcodeWithEarliestVerifiedClaims.claimsVerifiedOn
    );
    const currentMonth = months.currentMonth;
    const dates = [startMonth];
    while (
      new Date(nextMonth(dates)).getTime() <= new Date(currentMonth).getTime()
    ) {
      dates.push(nextMonth(dates));
    }
    return dates;
  };

  MonthlyFFSPayment.$parseClaimsByHcpQueryResult = function (results) {
    const monthlyFFSPayments = [];
    const hcpMontlyFFSPamyments = [];
    results.map((result) => {
      const [[month, rows]] = Object.entries(result);
      const totals = this.$computeTotals(rows);
      const mfpId = uuidv4();
      monthlyFFSPayments.push({
        id: mfpId,
        month,
        totalActualAmt: totals.amount,
        totalActualClaims: totals.claims,
      });
      rows.map((row) => hcpMontlyFFSPamyments.push({ ...row, mfpId }));
    });
    return { monthlyFFSPayments, hcpMontlyFFSPamyments };
  };

  MonthlyFFSPayment.$computeTotals = function (rows) {
    return rows.reduce(
      (acc, record) => {
        acc.amount += Number(record.amount);
        acc.claims += Number(record.totalClaims);
        return acc;
      },
      { amount: 0, claims: 0 }
    );
  };

  MonthlyFFSPayment.updateCurrentMonthRecord = async function (totals) {
    const currentMonth = months.firstDay(days.today);
    let ffsSumForCurrentMonth = await this.findOne({
      where: { month: new Date(currentMonth) },
    });
    if (ffsSumForCurrentMonth) {
      await ffsSumForCurrentMonth.update({
        totalActualAmt: totals.amount,
        totalActualClaims: totals.claims,
      });
    } else {
      ffsSumForCurrentMonth = await this.create({
        month: currentMonth,
        totalActualAmt: totals.amount,
        totalActualClaims: totals.claims,
      });
    }
    return ffsSumForCurrentMonth;
  };

  MonthlyFFSPayment.prototype.rejectIfNotReadyForAudit = function () {
    rejectIf(this.auditRequestDate === null, {
      withError: 'Record NOT ready for audit.',
    });
  };

  MonthlyFFSPayment.prototype.rejectIfPaid = function () {
    rejectIf(this.datePaid !== null, {
      withError: 'Action not allowed. Record has been paid.',
    });
  };

  MonthlyFFSPayment.prototype.rejectIfNotAuditPass = function () {
    rejectIf(this.auditStatus !== AUDIT_STATUS.auditPass, {
      withError: 'Action not allowed. Record has NOT passed audit.',
    });
  };

  MonthlyFFSPayment.prototype.rejectIfRecordHasPassedAudit = function () {
    rejectIf(this.auditStatus === AUDIT_STATUS.auditPass, {
      withError: 'Action not allowed. Record has passed audit.',
    });
  };

  MonthlyFFSPayment.prototype.rejectIfNotApproved = function () {
    rejectIf(this.dateApproved === null, {
      withError: 'Action not allowed. Record has NOT been approved.',
    });
  };

  MonthlyFFSPayment.prototype.rejectIfApproved = function () {
    rejectIf(this.dateApproved !== null, {
      withError: 'Action not allowed. Record has been approved.',
    });
  };

  MonthlyFFSPayment.prototype.rejectCurrentMonth = function () {
    rejectIf(this.isCurrentMonth, {
      withError: 'Operation not allowed on current running FFS until month end',
    });
  };

  return MonthlyFFSPayment;
};
