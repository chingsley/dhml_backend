'use strict';
module.exports = (sequelize, DataTypes) => {
  const EnrolleeHealthCareData = sequelize.define('EnrolleeHealthCareData', {
    primaryProvider: DataTypes.STRING,
    hcpCode: DataTypes.STRING,
    bloodGroup: DataTypes.STRING,
    significantMedicalHistory: DataTypes.STRING
  }, {});
  EnrolleeHealthCareData.associate = function(models) {
    // associations can be defined here
  };
  return EnrolleeHealthCareData;
};