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
    mfpId,
    t
  ) {
    await this.destroy({ where: { mfpId }, transaction: t });
    await this.bulkCreate(
      records.map((row) => ({ ...row, mfpId })),
      { transaction: t }
    );
    return true;
  };

  return HcpMonthlyFFSPayment;
};
