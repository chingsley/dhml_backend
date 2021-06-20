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
        },
        proxyCode: {
          type: Sequelize.STRING,
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
        referringHcpId: {
          type: Sequelize.INTEGER,
          references: {
            model: 'HealthCareProviders',
            key: 'id',
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        receivingHcpId: {
          type: Sequelize.INTEGER,
          references: {
            model: 'HealthCareProviders',
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
        clinicalFindings: {
          type: Sequelize.TEXT,
        },
        stateOfGeneration: {
          type: Sequelize.STRING,
        },
        specialtyId: {
          type: Sequelize.UUID,
          references: {
            model: 'Specialties',
            key: 'id',
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        requestState: {
          type: Sequelize.STRING,
        },
        requesterEmail: {
          // requester could be user or hcp so we can't use requesterId, as it will be referencing either hchp or user
          type: Sequelize.STRING,
        },
        dateFlagged: {
          type: Sequelize.DATE,
        },
        flaggedById: {
          type: Sequelize.INTEGER,
          references: {
            model: 'Users',
            key: 'id',
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        flagReason: {
          type: Sequelize.TEXT,
        },
        dateApproved: {
          type: Sequelize.DATE,
        },
        approvedById: {
          type: Sequelize.INTEGER,
          references: {
            model: 'Users',
            key: 'id',
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        dateDeclined: {
          type: Sequelize.DATE,
        },
        declinedById: {
          type: Sequelize.INTEGER,
          references: {
            model: 'Users',
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
