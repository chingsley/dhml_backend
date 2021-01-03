'use strict';
module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define(
    'Role',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isIn: {
            args: [['user', 'admin', 'superadmin']],
            msg: 'allowed roles are "user", "admin" or "superadmin"',
          },
        },
      },
    },
    {}
  );
  Role.associate = function (models) {
    Role.hasMany(models.User, {
      foreignKey: 'roleId',
      as: 'users',
    });
  };
  return Role;
};
