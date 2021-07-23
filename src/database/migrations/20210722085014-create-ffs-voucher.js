'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'FFSVouchers',
      {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
        },
        mfpId: {
          type: Sequelize.UUID,
          allowNull: false,
          unique: true,
          references: {
            model: 'MonthlyFFSPayments',
            key: 'id',
          },
          onDelete: 'RESTRICT',
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
        address: {
          type: Sequelize.TEXT,
        },
        amountInWords: {
          type: Sequelize.TEXT,
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
    return queryInterface.dropTable('FFSVouchers');
  },
};
