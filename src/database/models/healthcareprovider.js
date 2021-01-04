'use strict';
module.exports = (sequelize, DataTypes) => {
  const HealthCareProvider = sequelize.define('HealthCareProvider', {
    code: DataTypes.STRING,
    name: DataTypes.STRING
  }, {});
  HealthCareProvider.associate = function(models) {
    // associations can be defined here
  };
  return HealthCareProvider;
};