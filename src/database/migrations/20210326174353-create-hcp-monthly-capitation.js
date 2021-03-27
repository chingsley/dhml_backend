'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('HcpMonthlyCapitations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      hcpId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'HealthCareProviders',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      month: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      rrr: {
        type: Sequelize.STRING,
      },
      tsaCharge: {
        type: Sequelize.DOUBLE,
      },
      lives: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      gmcId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'GeneralMonthlyCapitations',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
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
    return queryInterface.dropTable('HcpMonthlyCapitations');
  },
};
