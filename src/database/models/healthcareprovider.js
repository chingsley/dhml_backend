'use strict';
module.exports = (sequelize, DataTypes) => {
  const HealthCareProvider = sequelize.define(
    'HealthCareProvider',
    {
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {}
  );
  HealthCareProvider.associate = function (models) {
    HealthCareProvider.hasMany(models.Enrollee, {
      foreignKey: 'hcpId',
      as: 'enrollees',
    });
  };
  return HealthCareProvider;
};
