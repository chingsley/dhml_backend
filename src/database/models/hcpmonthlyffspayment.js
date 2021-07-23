'use strict';

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
