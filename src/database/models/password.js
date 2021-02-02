'use strict';

module.exports = (sequelize, DataTypes) => {
  const Password = sequelize.define(
    'Password',
    {
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      hcpId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'HealthCareProviders',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {}
  );
  Password.associate = function (models) {
    Password.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return Password;
};
