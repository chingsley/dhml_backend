'use strict';

const { Op } = require('sequelize');
const { firstDayOfLastMonth } = require('../../utils/timers');

module.exports = (sequelize, DataTypes) => {
  const HcpMonthlyFFSPayment = sequelize.define(
    'HcpMonthlyFFSPayment',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      mfpId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'MonthlyFFSPayments',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      hcpId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'HealthCareProviders',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      totalClaims: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      earliestClaimsVerificationDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      auditRequestDate: {
        type: DataTypes.DATE,
      },
      rrr: {
        type: DataTypes.STRING,
      },
      tsaCharge: {
        type: DataTypes.DOUBLE,
      },
      selectedForPayment: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.auditRequestDate !== null;
        },
      },
      isOverdue: {
        type: DataTypes.VIRTUAL,
        get() {
          return (
            this.earliestClaimsVerificationDate < new Date(firstDayOfLastMonth)
          );
        },
      },
    },
    {}
  );
  HcpMonthlyFFSPayment.associate = function (models) {
    HcpMonthlyFFSPayment.belongsTo(models.MonthlyFFSPayment, {
      foreignKey: 'mfpId',
      as: 'monthlyFFSPayment',
    });
    HcpMonthlyFFSPayment.belongsTo(models.HealthCareProvider, {
      foreignKey: 'hcpId',
      as: 'hcp',
    });
  };
  HcpMonthlyFFSPayment.resetSelection = async function (mfpId) {
    await this.update(
      {
        auditRequestDate: null,
      },
      { where: { mfpId, auditRequestDate: { [Op.not]: null } } }
    );
  };
  HcpMonthlyFFSPayment.updateSelection = async function (mfpId, hcpIds) {
    await this.resetSelection(mfpId);
    const [_, updatedRecords] = await this.update(
      { auditRequestDate: new Date() },
      { where: { mfpId, hcpId: hcpIds }, returning: true }
    );
    return this.computeTotalSelections(updatedRecords);
  };
  HcpMonthlyFFSPayment.computeTotalSelections = function (updatedRecords) {
    const totals = updatedRecords.reduce(
      (acc, record) => {
        acc.selectedAmt += Number(record.amount);
        acc.selectedClaims += Number(record.totalClaims);
        return acc;
      },
      {
        selectedAmt: 0,
        selectedClaims: 0,
      }
    );
    return totals;
  };
  HcpMonthlyFFSPayment.updateCurrentMonthRecords = async function (
    records,
    mfpId
  ) {
    const hcpIds = records.map(({ hcpId }) => hcpId);
    const existingData = await this.findAll({
      where: { mfpId, hcpId: hcpIds },
    });
    if (existingData.length > 0) {
      // update existing records
      existingData.forEach((hcpData) => {
        const record = records.find(
          ({ hcpId }) => Number(hcpId) === Number(hcpData.hcpId)
        );
        hcpData.update(
          {
            amount: record.amount,
            totalClaims: record.totalClaims,
          },
          { where: { mfpId, hcpId: record.hcpId } }
        );
      });
    } else {
      // create new records
      this.bulkCreate(records.map((row) => ({ ...row, mfpId })));
    }

    return true;
  };

  return HcpMonthlyFFSPayment;
};
