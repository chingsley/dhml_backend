'use strict';

const { t24Hours } = require('../../utils/timers');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      staffId: {
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
  };
  return User;
};
