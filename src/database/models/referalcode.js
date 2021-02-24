'use strict';
module.exports = (sequelize, DataTypes) => {
  const ReferalCode = sequelize.define(
    'ReferalCode',
    {
      code: {
        type: DataTypes.STRING,
      },
      proxyCode: {
        type: DataTypes.STRING,
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
      stateOfGeneration: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      specialist: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      specialistCode: {
        type: DataTypes.STRING,
        allowNull: false,
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
