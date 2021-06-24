'use strict';
module.exports = (sequelize, DataTypes) => {
  const Specialty = sequelize.define(
    'Specialty',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {}
  );
  Specialty.associate = function (models) {
    // associations can be defined here
    Specialty.belongsToMany(models.HealthCareProvider, {
      through: 'HcpSpecialties',
      foreignKey: 'specialtyId',
      as: 'hcps',
    });
    Specialty.hasMany(models.ReferalCode, {
      foreignKey: 'specialtyId',
      as: 'referalCodes',
    });
  };
  return Specialty;
};
