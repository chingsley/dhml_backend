'use strict';
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
    },
    {}
  );
  User.associate = function (models) {
    User.belongsTo(models.Staff, {
      foreignKey: 'staffId',
      as: 'staffInfo',
    });
  };
  return User;
};
