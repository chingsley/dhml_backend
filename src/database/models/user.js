'use strict';

import bcrypt from 'bcryptjs';

const { BCRYPT_SALT } = process.env;

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      uuid: {
        unique: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      image: {
        type: DataTypes.TEXT,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    },
    {}
  );
  User.associate = function (models) {
    User.belongsTo(models.Role, {
      foreignKey: 'roleId',
      as: 'role',
    });
    User.hasOne(models.PasswordReset, {
      foreignKey: 'userId',
      as: 'passwordReset',
      onDelete: 'CASCADE',
    });
  };

  User.addHook('beforeCreate', async (user) => {
    if (user.password) {
      user.password = bcrypt.hashSync(user.password, Number(BCRYPT_SALT));
    }
  });

  User.addHook('beforeBulkCreate', async (users) => {
    for (let i = 0; i < users.length; i++) {
      if (users[i].dataValues.password) {
        users[i].dataValues.password = bcrypt.hashSync(
          users[i].dataValues.password,
          Number(BCRYPT_SALT)
        );
      }
    }
  });
  return User;
};
