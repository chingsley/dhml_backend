'use strict';
import { TOKEN_TYPES } from '../../shared/constants/lists.constants';
module.exports = (sequelize, DataTypes) => {
  const Token = sequelize.define(
    'Token',
    {
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        unique: true,
      },
      hcpId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'HealthCareProviders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        unique: true,
      },
      value: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isIn: [Object.values(TOKEN_TYPES)] },
      },
    },
    {}
  );
  Token.associate = function (models) {
    Token.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    Token.belongsTo(models.HealthCareProvider, {
      foreignKey: 'hcpId',
      as: 'hcp',
    });
  };
  return Token;
};
