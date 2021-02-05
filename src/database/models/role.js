'use strict';

const { throwError } = require('../../shared/helpers');

module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define(
    'Role',
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {}
  );
  Role.associate = function (models) {
    Role.hasMany(models.User, {
      foreignKey: 'roleId',
      as: 'users',
    });
    Role.hasMany(models.HealthCareProvider, {
      foreignKey: 'roleId',
      as: 'hcps',
    });
  };
  Role.findOneWhere = async function (condition, options) {
    const [[field, value]] = Object.entries(condition);
    const {
      throwErrorIfNotFound = true,
      errorMsg = `No Role matches the ${field}: ${value}`,
    } = options;
    const found = await Role.findOne({ where: condition });
    if (!found && throwErrorIfNotFound) {
      throwError({ status: 400, error: [errorMsg] });
    }
    return found;
  };
  return Role;
};
