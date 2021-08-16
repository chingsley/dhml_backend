'use strict';

const { throwError } = require('../../shared/helpers');
// const { isExpired } = require('../../utils/helpers');
// const { t24Hours } = require('../../utils/timers');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      staffId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Staffs',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      username: {
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
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {}
  );
  User.associate = function (models) {
    User.belongsTo(models.Staff, {
      foreignKey: 'staffId',
      as: 'staffInfo',
    });
    User.hasOne(models.Password, {
      foreignKey: 'userId',
      as: 'password',
    });
    User.belongsTo(models.Role, {
      foreignKey: 'roleId',
      as: 'role',
    });
    User.hasMany(models.ReferalCode, {
      foreignKey: 'approvedById',
      as: 'approvedCodes',
    });
    User.hasMany(models.ReferalCode, {
      foreignKey: 'flaggedById',
      as: 'flaggedCodes',
    });
    User.hasMany(models.AuditLog, {
      foreignKey: 'userId',
      as: 'auditLogs',
    });
  };
  User.findOneWhere = async function (condition, options) {
    const {
      include = [],
      throwErrorIfNotFound = true,
      errorMsg = 'No User matches the specified condition',
      errorCode,
      status = 400,
    } = options;
    const found = await User.findOne({ where: condition, include });
    if (!found && throwErrorIfNotFound) {
      throwError({ status, error: [errorMsg], errorCode });
    }
    return found;
  };
  return User;
};
