'use strict';

const { throwError } = require('../../shared/helpers');
const { isExpired } = require('../../utils/helpers');
const { t24Hours } = require('../../utils/timers');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      staffIdNo: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Staffs',
          key: 'staffIdNo',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
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
      hasChangedDefaultPassword: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      defaultPasswordExpiry: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: t24Hours,
      },
      hasExpiredDefaultPassword: {
        type: DataTypes.VIRTUAL,
        get() {
          return (
            !this.hasChangedDefaultPassword &&
            isExpired(this.defaultPasswordExpiry)
          );
        },
      },
    },
    {}
  );
  User.associate = function (models) {
    User.belongsTo(models.Staff, {
      foreignKey: 'staffIdNo',
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
  };
  User.findOneWhere = async function (condition, options) {
    const {
      throwErrorIfNotFound = true,
      errorMsg = 'No User matches the specified condition',
      include = [],
    } = options;
    const found = await User.findOne({ where: condition, include });
    if (!found && throwErrorIfNotFound) {
      throwError({ status: 400, error: [errorMsg] });
    }
    return found;
  };
  return User;
};
