'use strict';
const { AUDIT_STATUS } = require('../../shared/constants/lists.constants');
const { rejectIf, throwError } = require('../../shared/helpers');
const { moment, days, months } = require('../../utils/timers');
const { Op } = require('sequelize');

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

  MonthlyFFSPayment.prototype.checkPendingMonths = async function () {
    const [pendingRecord] =
      await this.sequelize.models.MonthlyFFSPayment.findAll({
        where: { month: { [Op.lt]: this.month }, datePaid: { [Op.is]: null } },
        order: [['month', 'ASC']],
        LIMIT: 1,
      });
    if (pendingRecord) {
      throwError({
        status: 403,
        error: [
          `Can't process ${moment(this.month).format(
            'MMMM YYYY'
          )} because ${moment(pendingRecord.month).format(
            'MMMM YYYY'
          )} has not been paid`,
        ],
      });
    }
  };

  return MonthlyFFSPayment;
};
