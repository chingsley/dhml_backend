/* eslint-disable no-unused-vars */
'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'Claims',
      {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
        },
        refcodeId: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        category: {
          type: Sequelize.STRING,
        },
        serviceName: {
          type: Sequelize.STRING,
        },
        drugDosageForm: {
          type: Sequelize.STRING,
        },
        drugStrength: {
          type: Sequelize.STRING,
        },
        drugPresentation: {
          type: Sequelize.STRING,
        },
        unit: {
          type: Sequelize.INTEGER,
        },
        pricePerUnit: {
          type: Sequelize.DECIMAL,
        },
        amount: {
          type: Sequelize.DECIMAL,
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
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Claims');
  },
};
