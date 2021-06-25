/* eslint-disable indent */
'use strict';

const { isExpired } = require('../../utils/helpers');

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
          model: 'Specialties',
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
      declineReason: {
        type: DataTypes.TEXT,
      },
      expiresAt: {
        type: DataTypes.DATE,
      },
      dateClaimed: {
        type: DataTypes.DATE,
      },
      status: {
        type: DataTypes.VIRTUAL,
        get() {
          switch (true) {
            case this.dateDeclined !== null:
              return 'DECLINED';
            case this.dateFlagged !== null:
              return 'FLAGGED';
            case this.dateApproved !== null:
              return 'APPROVED';
            default:
              return 'PENDING';
          }
        },
      },
      hasExpired: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.expiresAt === null ? false : isExpired(this.expiresAt);
        },
      },
      isClaimed: {
        type: DataTypes.VIRTUAL,
        get() {
          return !!this.dateClaimed;
        },
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
    ReferalCode.belongsTo(models.Specialty, {
      foreignKey: 'specialtyId',
      as: 'specialty',
    });
    ReferalCode.belongsTo(models.User, {
      foreignKey: 'approvedById',
      as: 'approvedBy',
    });
    ReferalCode.belongsTo(models.User, {
      foreignKey: 'flaggedById',
      as: 'flaggedBy',
    });
    ReferalCode.belongsTo(models.User, {
      foreignKey: 'declinedById',
      as: 'declinedBy',
    });
  };
  ReferalCode.findById = function (refcodeId) {
    return this.findOne({
      where: { id: refcodeId },
      include: [
        {
          model: this.sequelize.models.Enrollee,
          as: 'enrollee',
        },
        {
          model: this.sequelize.models.Specialty,
          as: 'specialty',
        },
      ],
      errorIfNotFound: `no referal code matches the id of ${refcodeId}`,
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
          model: this.sequelize.models.Specialty,
          as: 'specialty',
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
