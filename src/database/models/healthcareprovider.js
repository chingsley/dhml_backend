'use strict';

const { throwError, rejectIf } = require('../../shared/helpers');

module.exports = (sequelize, DataTypes) => {
  const HealthCareProvider = sequelize.define(
    'HealthCareProvider',
    {
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'active',
      },
      address: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phoneNumber: {
        type: DataTypes.STRING,
      },
      alternativePhoneNumber: {
        type: DataTypes.STRING,
      },
      bank: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      bankAddress: {
        type: DataTypes.STRING,
      },
      accountNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      accountName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      accountType: {
        type: DataTypes.STRING,
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Roles',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      armOfService: {
        type: DataTypes.STRING,
      },
      geopoliticalZone: {
        type: DataTypes.STRING,
      },
    },
    {}
  );
  HealthCareProvider.associate = function (models) {
    HealthCareProvider.hasMany(models.Enrollee, {
      foreignKey: 'hcpId',
      as: 'enrollees',
    });
    HealthCareProvider.belongsTo(models.Role, {
      foreignKey: 'roleId',
      as: 'role',
    });
    HealthCareProvider.hasOne(models.Password, {
      foreignKey: 'hcpId',
      as: 'password',
    });
    HealthCareProvider.hasOne(models.Token, {
      foreignKey: 'hcpId',
      as: 'token',
    });
    HealthCareProvider.hasMany(models.ReferalCode, {
      foreignKey: 'receivingHcpId',
      as: 'referalCodes',
    });
    HealthCareProvider.hasMany(models.HcpMonthlyCapitation, {
      foreignKey: 'hcpId',
      as: 'hcpMonthlyCapSum',
    });
    HealthCareProvider.hasMany(models.HcpSpecialty, {
      foreignKey: 'hcpId',
      as: 'hcpSpecialties',
    });
    HealthCareProvider.belongsToMany(models.Specialty, {
      through: 'HcpSpecialties',
      foreignKey: 'hcpId',
      as: 'specialties',
    });
    HealthCareProvider.hasMany(models.HcpMonthlyFFSPayment, {
      foreignKey: 'hcpId',
      as: 'ffsPayments',
    });
    HealthCareProvider.hasMany(models.Encounter, {
      foreignKey: 'hcpId',
      as: 'encounters',
    });
  };
  HealthCareProvider.findOneWhere = async function (condition, options) {
    const {
      include = [],
      throwErrorIfNotFound = true,
      errorMsg = 'No HCP matches the specified condition',
      errorCode,
      status = 400,
    } = options;
    const found = await HealthCareProvider.findOne({
      where: condition,
      include,
    });
    if (!found && throwErrorIfNotFound) {
      throwError({ status: status, error: [errorMsg], errorCode });
    }
    return found;
  };
  HealthCareProvider.prototype.addSpecialties = function (
    arrOfSpecialtyIds,
    transaction = {}
  ) {
    const promiseArr = arrOfSpecialtyIds.map((specialtyId) =>
      this.sequelize.models.HcpSpecialty.create(
        { hcpId: this.id, specialtyId },
        transaction
      )
    );
    return Promise.all(promiseArr);
  };
  HealthCareProvider.prototype.validateSpecialtyId = async function (
    specialtyId
  ) {
    await this.reload({
      include: { model: this.sequelize.models.Specialty, as: 'specialties' },
    });
    const specialty = await this.sequelize.models.Specialty.findOne({
      where: { id: specialtyId },
    });
    rejectIf(!specialty, {
      withError: `No Specialty found for the id ${specialtyId}`,
      status: 404,
    });
    rejectIf(!this.specialties.map((sp) => sp.id).includes(specialtyId), {
      withError: `The Receiving HCP: ${this.name} does not have a specialist for ${specialty.name}`,
      status: 404,
    });
  };

  HealthCareProvider.prototype.removeSpecialties = function (specialtyIdArr) {
    return this.sequelize.models.HcpSpecialty.destroy({
      where: { specialtyId: specialtyIdArr, hcpId: this.id },
    });
  };
  HealthCareProvider.prototype.mustHaveEmail = function () {
    rejectIf(!this.email, {
      withError: `Request Failed. The HCP ${this.code} has no email in the system`,
      status: 422,
    });
  };

  return HealthCareProvider;
};
