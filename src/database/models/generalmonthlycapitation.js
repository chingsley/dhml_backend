'use strict';

import { QueryTypes } from 'sequelize';
import { monthlyCapSum } from '../scripts/approvals.scripts';
import {
  moment,
  months,
  getNextMonth,
  isFutureMonth,
} from '../../utils/timers';
import { AUDIT_STATUS } from '../../shared/constants/lists.constants';

module.exports = (sequelize, DataTypes) => {
  const GeneralMonthlyCapitation = sequelize.define(
    'GeneralMonthlyCapitation',
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
      rateInNaira: {
        type: DataTypes.DOUBLE,
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
        defaultValue: AUDIT_STATUS.pending,
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
  GeneralMonthlyCapitation.associate = function (models) {
    GeneralMonthlyCapitation.hasMany(models.HcpMonthlyCapitation, {
      foreignKey: 'gmcId',
      as: 'hcpMonthlyCapitations',
    });
    GeneralMonthlyCapitation.hasOne(models.Voucher, {
      foreignKey: 'gmcId',
      as: 'voucher',
    });
  };

  GeneralMonthlyCapitation.prototype.getNextMonths = function (i) {
    return moment(this.month).add(i, 'months').format('YYYY-MM-DD');
  };

  GeneralMonthlyCapitation.prototype.formatMonth = function (format) {
    return moment(this.month).format(format);
  };

  GeneralMonthlyCapitation.runScript = async function (
    queryFunction,
    reqQuery
  ) {
    const { dialect, database } = sequelize.options;
    const rows = await sequelize.query(
      queryFunction(dialect, database, reqQuery),
      {
        type: QueryTypes.SELECT,
      }
    );
    return rows;
  };

  GeneralMonthlyCapitation.updateRecords_Depricated = async function () {
    let [lastRecordedCapSum] = await this.findAll({
      order: [['month', 'DESC']],
      limit: 1,
    });

    if (!lastRecordedCapSum) {
      return this.createNewRecords();
    }

    const bulkQuery = [];
    let i = 0; // 0 so that it includes the lastRecordedCapSum in the list to update
    while (
      new Date(lastRecordedCapSum.getNextMonths(i)).getTime() <=
      new Date(months.currentMonth).getTime()
    ) {
      bulkQuery.push(
        this.runScript(monthlyCapSum, {
          date: lastRecordedCapSum.getNextMonths(i),
        })
      );
      i = i + 1;
    }
    const results = await Promise.all(bulkQuery);

    const upserts = results.map(([result]) => this.upsert(result));
    await Promise.all(upserts);
  };

  GeneralMonthlyCapitation.createNewRecords = async function (startMonth) {
    if (isFutureMonth(startMonth)) return;

    const currentMonth = months.currentMonth;
    const dates = [startMonth];
    while (
      new Date(getNextMonth(dates)).getTime() <=
      new Date(currentMonth).getTime()
    ) {
      dates.push(getNextMonth(dates));
    }
    const bulkQuery = dates.map((date) =>
      this.runScript(monthlyCapSum, { date })
    );

    const results = await Promise.all(bulkQuery);
    await this.bulkCreate(results.map((results) => results[0]));
  };

  GeneralMonthlyCapitation.updateRecords = async function () {
    const currentRecords = await this.findAll({
      order: [['month', 'DESC']],
      attributes: ['month', 'auditStatus'],
    });

    let startMonth;
    if (currentRecords.length !== 0) {
      this.updateCurrentRecords(currentRecords);
      const mostRecentRecord = currentRecords[0];
      const nextMonth = getNextMonth([mostRecentRecord.month]);
      startMonth = nextMonth;
    } else {
      const firstVerifiedEnrollee =
        await this.sequelize.models.Enrollee.getFirstVerifiedEnrollee();
      startMonth =
        firstVerifiedEnrollee &&
        months.firstDay(firstVerifiedEnrollee.dateVerified);
    }
    if (startMonth) {
      await this.createNewRecords(startMonth);
    }
  };

  GeneralMonthlyCapitation.updateCurrentRecords = async function (
    currentRecords
  ) {
    const pendingAndFlaggedRecords = currentRecords.filter(
      (record) => record.auditStatus !== AUDIT_STATUS.auditPass
    );

    const bulkQuery = pendingAndFlaggedRecords.map((record) => {
      return this.runScript(monthlyCapSum, {
        date: moment(record.month).format('YYYY-MM-DD'),
      });
    });
    const results = await Promise.all(bulkQuery);
    const upserts = results.map(([result]) => this.upsert(result));
    await Promise.all(upserts);
  };

  GeneralMonthlyCapitation.updateAndFindOne = async function (options) {
    await this.updateRecords();
    return this.findOne(options);
  };
  return GeneralMonthlyCapitation;
};
