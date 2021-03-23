'use strict';
import { moment } from '../../utils/timers';

module.exports = (sequelize, DataTypes) => {
  const MonthlyCapitationSum = sequelize.define(
    'MonthlyCapitationSum',
    {
      month: {
        type: DataTypes.DATE,
        allowNull: false,
        unique: true,
      },
      lives: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      dateApproved: {
        type: DataTypes.DATE,
      },
      dateAudited: {
        type: DataTypes.DATE,
      },
      datePaid: {
        type: DataTypes.DATE,
      },
      flagReason: {
        type: DataTypes.STRING,
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
      isAudited: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.dateAudited !== null;
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
  // eslint-disable-next-line no-unused-vars
  MonthlyCapitationSum.associate = function (models) {
    // associations can be defined here
  };
  MonthlyCapitationSum.prototype.nextMonths = function (i) {
    return moment(this.month).add(i, 'months').format('YYYY-MM-DD');
  };
  MonthlyCapitationSum.prototype.formatMonth = function (format) {
    return moment(this.month).format(format);
  };
  return MonthlyCapitationSum;
};

// moment('2021-03-01').format('MMMM YYYY')
