'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'Vouchers',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        gmcId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
          references: {
            model: 'GeneralMonthlyCapitations',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        department: {
          type: Sequelize.STRING,
        },
        acCode: {
          type: Sequelize.STRING,
        },
        pvNo: {
          type: Sequelize.STRING,
        },
        payee: {
          type: Sequelize.STRING,
        },
        serviceDate: {
          type: Sequelize.DATE,
        },
        serviceDescription: {
          type: Sequelize.TEXT,
        },
        preparedBy: {
          type: Sequelize.STRING,
        },
        preparerDesignation: {
          type: Sequelize.STRING,
        },
        datePrepared: {
          type: Sequelize.DATE,
        },
        authorizedBy: {
          type: Sequelize.STRING,
        },
        authorizerDesignation: {
          type: Sequelize.STRING,
        },
        dateAuthorized: {
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
    return queryInterface.dropTable('Vouchers');
  },
};
