'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'HcpMonthlyFFSPayments',
      {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
        },
        mfpId: {
          type: Sequelize.UUID,
          references: {
            model: 'MonthlyFFSPayments',
            key: 'id',
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        hcpId: {
          type: Sequelize.INTEGER,
          references: {
            model: 'HealthCareProviders',
            key: 'id',
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        totalClaims: {
          type: Sequelize.INTEGER,
        },
        amount: {
          type: Sequelize.DECIMAL,
        },
        earliestClaimsVerificationDate: {
          type: Sequelize.DATE,
        },
        auditRequestDate: {
          type: Sequelize.DATE,
        },
        rrr: {
          type: Sequelize.STRING,
        },
        tsaCharge: {
          type: Sequelize.DOUBLE,
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
    return queryInterface.dropTable('HcpMonthlyFFSPayments');
  },
};
