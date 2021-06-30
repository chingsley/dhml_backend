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
        preparedBy: {
          // could be user or hcp so we can't use preparerId, as it will be referencing either hchp or user
          // for a user, preparedBy = user.staffInfo.staffIdNo
          // for hcp, preparedBy = hcp.code
          type: Sequelize.STRING,
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
