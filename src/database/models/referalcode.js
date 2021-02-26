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
  ReferalCode.prototype.reloadAfterCreate = async function () {
    await this.reload({
      include: [
        {
          model: this.sequelize.models.Enrollee,
          as: 'enrollee',
          attributes: [
            'enrolleeIdNo',
            'surname',
            'firstName',
            'middleName',
            'serviceNumber',
            'serviceStatus',
            'staffNumber',
            'scheme',
          ],
          include: {
            model: this.sequelize.models.HealthCareProvider,
            as: 'hcp',
            attributes: ['id', 'code', 'name'],
          },
        },
        {
          model: this.sequelize.models.HealthCareProvider,
          as: 'destinationHcp',
          attributes: ['id', 'code', 'name'],
        },
        {
          model: this.sequelize.models.User,
          as: 'generatedBy',
          attributes: ['id', 'username'],
          include: {
            model: this.sequelize.models.Staff,
            as: 'staffInfo',
            attributes: ['id', 'firstName', 'surname', 'staffIdNo'],
          },
        },
      ],
    });
  };
  return ReferalCode;
};
