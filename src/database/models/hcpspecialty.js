'use strict';
module.exports = (sequelize, DataTypes) => {
  const HcpSpecialty = sequelize.define(
    'HcpSpecialty',
    {
      hcpId: DataTypes.INTEGER,
      specialtyId: DataTypes.UUID,
    },
    {}
  );
  // eslint-disable-next-line no-unused-vars
  HcpSpecialty.associate = function (models) {
    // associations can be defined here
  };
  return HcpSpecialty;
};
