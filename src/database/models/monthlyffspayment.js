'use strict';

const { AUDIT_STATUS } = require('../../shared/constants/lists.constants');
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
      totalClaims: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
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
  MonthlyFFSPayment.updateCurrentMonthRecord = async function (totals, t) {
    const currentMonth = months.firstDay(days.today);
    let ffsSumForCurrentMonth = await this.findOne({
      where: { month: new Date(currentMonth) },
    });
    if (ffsSumForCurrentMonth) {
      await ffsSumForCurrentMonth.update(
        {
          amount: totals.amount,
          totalClaims: totals.claims,
        },
        { transaction: t }
      );
    } else {
      ffsSumForCurrentMonth = await this.create(
        {
          month: currentMonth,
          amount: totals.amount,
          totalClaims: totals.claims,
        },
        { transaction: t }
      );
    }
    return ffsSumForCurrentMonth;
  };
  return MonthlyFFSPayment;
};
