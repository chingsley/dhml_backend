'use strict';
module.exports = (sequelize, DataTypes) => {
  const Specialty = sequelize.define(
    'Specialty',
    {
      // id: {
      //   type: DataTypes.UUID,
      //   primaryKey: true,
      //   defaultValue: DataTypes.UUIDV4,
      //   allowNull: false,
      // },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
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
  };
  return Specialty;
};
