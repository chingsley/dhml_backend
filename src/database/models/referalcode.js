'use strict';
module.exports = (sequelize, DataTypes) => {
  const ReferalCode = sequelize.define(
    'ReferalCode',
    {
      code: {
        type: DataTypes.STRING,
        unique: true,
      },
      proxyCode: {
        type: DataTypes.STRING,
        unique: true,
      },
      enrolleeId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Enrollees',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      destinationHcpId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'HealthCareProviders',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      operatorId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      reasonForReferral: {
        type: DataTypes.TEXT,
      },
      diagnosis: {
        type: DataTypes.STRING,
      },
      diagnosisStatus: {
        type: DataTypes.STRING, // final or provisional
      },
      clinicalFindings: {
        type: DataTypes.TEXT,
      },
      specialistService: {
        type: DataTypes.STRING,
      },
      isFlagged: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      flagReason: {
        type: DataTypes.TEXT,
      },
    },
    {}
  );
  ReferalCode.associate = function (models) {
    ReferalCode.belongsTo(models.Enrollee, {
      foreignKey: 'enrolleeId',
      as: 'enrollee',
    });
    ReferalCode.belongsTo(models.HealthCareProvider, {
      foreignKey: 'destinationHcpId',
      as: 'destinationHcp',
    });
    ReferalCode.belongsTo(models.User, {
      foreignKey: 'operatorId',
      as: 'generatedBy',
    });
  };
  return ReferalCode;
};
