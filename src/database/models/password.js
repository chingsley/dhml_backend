'use strict';

const { t24Hours } = require('../../utils/timers');

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
      isDefaultValue: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      expiryDate: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: t24Hours,
      },
    },
    {}
  );
  Password.associate = function (models) {
    Password.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    Password.belongsTo(models.HealthCareProvider, {
      foreignKey: 'hcpId',
      as: 'hcp',
    });
  };

  return Password;
};
