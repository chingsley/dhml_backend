'use strict';
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
        references: {
          model: 'MonthlyFFSPayments',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      hcpId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'HealthCareProviders',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      totalClaims: {
        type: DataTypes.INTEGER,
      },
      amount: {
        type: DataTypes.DECIMAL,
      },
      earliestClaimsVerificationDate: {
        type: DataTypes.DATE,
      },
      isSelectedForPayment: {
        type: DataTypes.BOOLEAN,
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
  return HcpMonthlyFFSPayment;
};
