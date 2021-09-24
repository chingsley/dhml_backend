'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'Tokens',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        userId: {
          type: Sequelize.INTEGER,
          references: {
            model: 'Users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        hcpId: {
          type: Sequelize.INTEGER,
          references: {
            model: 'HealthCareProviders',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        value: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        type: {
          type: Sequelize.STRING,
        },
        expiresAt: {
          type: Sequelize.DATE,
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: new Date(),
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: new Date(),
        },
      },
      {
        freezeTableName: true,
      }
    );
  },
  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Tokens');
  },
};
