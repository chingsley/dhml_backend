'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'GeneralMonthlyCapitations',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        month: {
          type: Sequelize.DATE,
          allowNull: false,
          unique: true,
        },
        lives: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        rateInNaira: {
          type: Sequelize.DOUBLE,
          allowNull: false,
        },
        amount: {
          type: Sequelize.DOUBLE,
          allowNull: false,
        },
        dateApproved: {
          type: Sequelize.DATE,
        },
        auditStatus: {
          type: Sequelize.STRING,
        },
        dateAudited: {
          type: Sequelize.DATE,
        },
        flagReason: {
          type: Sequelize.STRING,
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
    return queryInterface.dropTable('GeneralMonthlyCapitations');
  },
};
