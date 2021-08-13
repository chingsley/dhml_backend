/* eslint-disable indent */
'use strict';
const { Op } = require('sequelize');
const { rejectIf } = require('../../shared/helpers');
const { isExpired } = require('../../utils/helpers');

module.exports = (sequelize, DataTypes) => {
  const ReferalCode = sequelize.define(
    'ReferalCode',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
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
        // for a user, requestedBy = user.staffInfo.staffIdNo
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
      claimsVerifiedOn: {
        type: DataTypes.DATE,
      },
      claimsVerifierId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      remarksOnClaims: {
        type: DataTypes.TEXT,
      },
      claimsSupportingDocument: {
        type: DataTypes.TEXT,
      },
      monthPaidFor: {
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
      isExpired: {
        type: DataTypes.VIRTUAL,
        get() {
          return !this.expiresAt ? false : isExpired(this.expiresAt);
        },
      },
      isClaimed: {
        type: DataTypes.VIRTUAL,
        get() {
          return !!this.claimsVerifiedOn;
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
    ReferalCode.hasMany(models.Claim, {
      foreignKey: 'refcodeId',
      as: 'claims',
      onDelete: 'CASCADE',
    });
  };
  ReferalCode.findById = async function (refcodeId) {
    const refcode = await this.findOne({
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
        {
          model: this.sequelize.models.HealthCareProvider,
          as: 'receivingHcp',
        },
        {
          model: this.sequelize.models.Claim,
          as: 'claims',
        },
      ],
    });
    const errorIfNotFound = `no referal code matches the id of ${refcodeId}`;
    rejectIf(!refcode, { withError: errorIfNotFound });
    return refcode;
  };
  ReferalCode.prototype.updateAndReload = async function (changes) {
    await this.update(changes);
    await this.reloadWithAssociations();
    return this;
  };
  ReferalCode.createAndReload = async function (requestDetails) {
    const refcode = await this.create(requestDetails);
    await refcode.reloadWithAssociations();
    return refcode;
  };
  ReferalCode.prototype.reloadWithAssociations = async function () {
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
        ...['referringHcp', 'receivingHcp'].map((item) => ({
          model: this.sequelize.models.HealthCareProvider,
          as: item,
          attributes: ['id', 'name', 'code'],
        })),
        {
          model: this.sequelize.models.Specialty,
          as: 'specialty',
        },
        ...['declinedBy', 'flaggedBy', 'approvedBy'].map((item) => ({
          model: this.sequelize.models.User,
          as: item,
          attributes: ['id', 'username'],
          include: {
            model: this.sequelize.models.Staff,
            as: 'staffInfo',
            attributes: ['id', 'firstName', 'surname', 'staffIdNo'],
          },
        })),
        {
          model: this.sequelize.models.Claim,
          as: 'claims',
        },
      ],
    });
  };
  ReferalCode.prototype.rejectIfCodeIsExpired = function (errorMsg) {
    rejectIf(this.expiresAt && isExpired(this.expiresAt), {
      withError: errorMsg || 'Action not allowed because the code has expired',
      status: 403,
    });
  };
  ReferalCode.prototype.rejectIfCodeIsClaimed = function (errorMsg) {
    rejectIf(!!this.claimsVerifiedOn, {
      withError:
        errorMsg || 'Action not allowed because the code has verified claims',
      status: 403,
    });
  };
  ReferalCode.prototype.rejectIfCodeIsDeclined = function (errorMsg) {
    rejectIf(!!this.dateDeclined, {
      withError:
        errorMsg ||
        'Action not allowed because the code has already been declined',
      status: 403,
    });
  };
  ReferalCode.prototype.rejectIfCodeIsApproved = function (errorMsg) {
    rejectIf(!!this.dateApproved, {
      withError:
        errorMsg || 'Action not allowed because the code has been approved',
      status: 403,
    });
  };
  ReferalCode.prototype.rejectIfNotApproved = function (errorMsg) {
    rejectIf(!this.dateApproved, {
      withError:
        errorMsg || 'Action not allowed because the code has NOT been approved',
      status: 403,
    });
  };
  ReferalCode.prototype.rejectIfClaimsNotFound = function (errorMsg) {
    rejectIf(!this.claims || this.claims.length === 0, {
      withError: errorMsg || 'No Claims found for the referal code',
      status: 403,
    });
  };

  ReferalCode.prototype.disallowIf = function (arr) {
    if (arr.includes('expired')) this.rejectIfCodeIsExpired();
    if (arr.includes('claimed')) this.rejectIfCodeIsClaimed();
    if (arr.includes('declined')) this.rejectIfCodeIsDeclined();
    if (arr.includes('approved')) this.rejectIfCodeIsApproved();
  };
  ReferalCode.getRefcodeWithEarliestVerifiedClaims = async function () {
    const [firstVerifiedEnrollee] = await this.findAll({
      where: { claimsVerifiedOn: { [Op.not]: null } },
      order: [['claimsVerifiedOn', 'ASC']],
      limit: 1,
    });
    return firstVerifiedEnrollee;
  };
  return ReferalCode;
};
