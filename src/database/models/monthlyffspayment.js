'use strict';

const { AUDIT_STATUS } = require('../../shared/constants/lists.constants');
const { rejectIf } = require('../../shared/helpers');
const { moment, days, months } = require('../../utils/timers');

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
      withError: 'Record not ready for audit.',
    });
  };
  return MonthlyFFSPayment;
};
