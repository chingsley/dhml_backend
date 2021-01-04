'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('EnrolleeContactDetails', {
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
      phoneNumber: {
        type: Sequelize.STRING,
      },
      email: {
        type: Sequelize.STRING,
      },
      residentialAddress: {
        type: Sequelize.STRING,
      },
      stateOfResidence: {
        type: Sequelize.STRING,
      },
      lga: {
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
    return queryInterface.dropTable('EnrolleeContactDetails');
  },
};
