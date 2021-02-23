'use strict';

const { throwError } = require('../../shared/helpers');

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
        allowNull: false,
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
      accountType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Roles',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
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
    HealthCareProvider.hasMany(models.ReferalCode, {
      foreignKey: 'destinationHcpId',
      as: 'referalCodes',
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
  return HealthCareProvider;
};
