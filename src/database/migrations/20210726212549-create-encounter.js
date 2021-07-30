'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'Encounters',
      {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
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
        hcpId: {
          type: Sequelize.INTEGER,
          references: {
            model: 'HealthCareProviders',
            key: 'id',
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        diagnosis: {
          type: Sequelize.STRING,
        },
        cost: {
          type: Sequelize.DECIMAL,
        },
        prescription: {
          type: Sequelize.TEXT,
        },
        isRepeatVisit: {
          type: Sequelize.BOOLEAN,
        },
        isReferalVisit: {
          type: Sequelize.BOOLEAN,
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      },
      {
        freezeTableName: true,
      }
    );
  },
  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Encounters');
  },
};
