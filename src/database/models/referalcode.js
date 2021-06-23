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
      referringHcpId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'HealthCareProviders',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      receivingHcpId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'HealthCareProviders',
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
      clinicalFindings: {
        type: DataTypes.TEXT,
      },
      stateOfGeneration: {
        type: DataTypes.STRING,
      },
      specialtyId: {
        type: DataTypes.UUID,
        references: {
          model: 'Specialists',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      requestState: {
        type: DataTypes.STRING,
      },
      requestedBy: {
        // could be user or hcp so we can't use requesterId, as it will be referencing either hchp or user
        // for a user, requestedBy = user.staffInfo.email
        // for hcp, requestedBy = hcp.code
        type: DataTypes.STRING,
      },
      dateFlagged: {
        type: DataTypes.DATE,
      },
      flaggedById: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      flagReason: {
        type: DataTypes.TEXT,
      },
      dateApproved: {
        type: DataTypes.DATE,
      },
      approvedById: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      dateDeclined: {
        type: DataTypes.DATE,
      },
      declinedById: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
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
      foreignKey: 'referringHcpId',
      as: 'referringHcp',
    });
    ReferalCode.belongsTo(models.HealthCareProvider, {
      foreignKey: 'receivingHcpId',
      as: 'receivingHcp',
    });
    ReferalCode.belongsTo(models.User, {
      foreignKey: 'approvedById',
      as: 'approvedBy',
    });
    ReferalCode.belongsTo(models.User, {
      foreignKey: 'flaggedById',
      as: 'flaggedBy',
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
        },
        {
          model: this.sequelize.models.HealthCareProvider,
          as: 'referringHcp',
          attributes: ['id', 'code', 'name'],
        },
        {
          model: this.sequelize.models.HealthCareProvider,
          as: 'receivingHcp',
          attributes: ['id', 'code', 'name'],
        },
        {
          model: this.sequelize.models.User,
          as: 'flaggedBy',
          attributes: ['id', 'username'],
          include: {
            model: this.sequelize.models.Staff,
            as: 'staffInfo',
            attributes: ['id', 'firstName', 'surname', 'staffIdNo'],
          },
        },
        {
          model: this.sequelize.models.User,
          as: 'approvedBy',
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
