'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'MonthlyFFSPayments',
      {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
        },
        month: {
          type: Sequelize.DATE,
        },
        totalClaims: {
          type: Sequelize.INTEGER,
        },
        amount: {
          type: Sequelize.DECIMAL,
        },
        dateAudited: {
          type: Sequelize.DATE,
        },
        auditStatus: {
          type: Sequelize.STRING,
        },
        flagReason: {
          type: Sequelize.TEXT,
        },
        dateApproved: {
          type: Sequelize.DATE,
        },
        datePaid: {
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
    return queryInterface.dropTable('MonthlyFFSPayments');
  },
};
