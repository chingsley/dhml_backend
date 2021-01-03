'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('EnrolleeHealthCareData', {
      id: {
        allowNull: false,
        primaryKey: true,
        unique: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      enrolleeId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'Enrollees',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      primaryProvider: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      hcpCode: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      bloodGroup: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      significantMedicalHistory: {
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
    });
  },
  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('EnrolleeHealthCareData');
  },
};
