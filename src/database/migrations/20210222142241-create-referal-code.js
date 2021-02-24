/* eslint-disable no-unused-vars */
'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'ReferalCodes',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        code: {
          type: Sequelize.STRING,
          unique: true,
        },
        proxyCode: {
          type: Sequelize.STRING,
          unique: true,
        },
        enrolleeId: {
          type: Sequelize.INTEGER,
          references: {
            model: 'Enrollees',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        destinationHcpId: {
          type: Sequelize.INTEGER,
          references: {
            model: 'HealthCareProviders',
            key: 'id',
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        generatedBy: {
          type: Sequelize.INTEGER,
          references: {
            model: 'Users',
            key: 'id',
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        reasonForReferral: {
          type: Sequelize.TEXT,
        },
        diagnosis: {
          type: Sequelize.STRING,
        },
        diagnosisStatus: {
          type: Sequelize.STRING, // final or provisional
        },
        clinicalFindings: {
          type: Sequelize.TEXT,
        },
        specialistService: {
          type: Sequelize.STRING,
        },
        isFlagged: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        flagReason: {
          type: Sequelize.TEXT,
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
    return queryInterface.dropTable('ReferalCodes');
  },
};
