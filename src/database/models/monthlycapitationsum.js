'use strict';
import { moment } from '../../utils/timers';
import { QueryTypes } from 'sequelize';
import { monthlyCapSum } from '../scripts/approvals.scripts';
import { months, nextMonth } from '../../utils/timers';

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
      auditStatus: {
        type: DataTypes.STRING,
        defaultValue: 'pending',
      },
      dateAudited: {
        type: DataTypes.DATE,
      },
      flagReason: {
        type: DataTypes.STRING,
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
      isCurrentMonth: {
        type: DataTypes.VIRTUAL,
        get() {
          return (
            moment(this.month).clone().startOf('month').format('YYYY-MM-DD') ===
            moment().clone().startOf('month').format('YYYY-MM-DD')
          );
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

  MonthlyCapitationSum.runScript = async function (
    queryFunction,
    reqQuery,
    key
  ) {
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

  MonthlyCapitationSum.updateRecords = async function () {
    let [lastRecordedCapSum] = await this.findAll({
      order: [['month', 'DESC']],
      limit: 1,
    });

    if (!lastRecordedCapSum) {
      return this.initializeRecords();
    }

    const bulkQuery = [];
    let i = 0;
    while (
      new Date(lastRecordedCapSum.nextMonths(i)).getTime() <=
      new Date(months.currentMonth).getTime()
    ) {
      bulkQuery.push(
        this.runScript(monthlyCapSum, {
          date: lastRecordedCapSum.nextMonths(i),
        })
      );
      i = i + 1;
    }

    const results = await Promise.all(bulkQuery);
    const upserts = results.map(([result]) => this.upsert(result));
    await Promise.all(upserts);
  };

  MonthlyCapitationSum.initializeRecords = async function () {
    // const { log } = console;
    const firstVerifiedEnrollee = await this.sequelize.models.Enrollee.getFirstVerifiedEnrollee();
    const startMonth = months.firstDay(firstVerifiedEnrollee.dateVerified);
    const currentMonth = months.currentMonth;
    const dates = [startMonth];
    while (
      new Date(nextMonth(dates)).getTime() <= new Date(currentMonth).getTime()
    ) {
      dates.push(nextMonth(dates));
    }
    const bulkQuery = dates.map((date) =>
      this.runScript(monthlyCapSum, { date })
    );
    // log('here.....1.1');
    const results = await Promise.all(bulkQuery);
    // log('here.....1.2');
    const upserts = results.map(([result]) => this.upsert(result));
    await Promise.all(upserts);
  };
  MonthlyCapitationSum.updateAndFindOne = async function (options) {
    await this.updateRecords();
    return this.findOne(options);
  };
  return MonthlyCapitationSum;
};
