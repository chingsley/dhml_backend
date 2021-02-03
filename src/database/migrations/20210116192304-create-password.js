'use strict';

const { t24Hours } = require('../../utils/timers');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Passwords', {
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
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      hcpId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'HealthCareProviders',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      isDefaultValue: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      expiryDate: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: t24Hours,
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
    });
  },
  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Passwords');
  },
};
