'use strict';
module.exports = (sequelize, DataTypes) => {
  const HealthCareProvider = sequelize.define(
    'HealthCareProvider',
    {
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {}
  );
  // eslint-disable-next-line no-unused-vars
  HealthCareProvider.associate = function (models) {
    // associations can be defined here
  };
  return HealthCareProvider;
};
