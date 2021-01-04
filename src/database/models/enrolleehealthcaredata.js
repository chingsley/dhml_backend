'use strict';
module.exports = (sequelize, DataTypes) => {
  const EnrolleeHealthCareData = sequelize.define(
    'EnrolleeHealthCareData',
    {
      enrolleeId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: 'Enrollees',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
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
      bloodGroup: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      significantMedicalHistory: {
        type: DataTypes.STRING,
      },
    },
    {}
  );
  // eslint-disable-next-line no-unused-vars
  EnrolleeHealthCareData.associate = function (models) {
    // associations can be defined here
  };
  return EnrolleeHealthCareData;
};
