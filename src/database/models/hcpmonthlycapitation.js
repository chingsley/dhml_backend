'use strict';
module.exports = (sequelize, DataTypes) => {
  const HcpMonthlyCapitation = sequelize.define(
    'HcpMonthlyCapitation',
    {
      hcpId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: 'HealthCareProviders',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      month: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      rrr: {
        type: DataTypes.STRING,
      },
      tsaCharge: {
        type: DataTypes.DOUBLE,
      },
      amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      gmcId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: 'GeneralMonthlyCapitations',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
    },
    {}
  );
  HcpMonthlyCapitation.associate = function (models) {
    HcpMonthlyCapitation.belongsTo(models.HealthCareProvider, {
      foreignKey: 'hcpId',
      as: 'hcp',
    });
    HcpMonthlyCapitation.belongsTo(models.GeneralMonthlyCapitation, {
      foreignKey: 'gmcId',
      as: 'generalMonthlyCapitation',
    });
  };
  return HcpMonthlyCapitation;
};
