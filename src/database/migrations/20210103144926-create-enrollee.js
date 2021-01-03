'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'Enrollees',
      {
        id: {
          allowNull: false,
          primaryKey: true,
          unique: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
        },
        enrolleeIdNo: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        scheme: {
          type: Sequelize.STRING,
        },
        surname: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        firstName: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        middleName: {
          type: Sequelize.STRING,
        },
        rank: {
          type: Sequelize.STRING,
        },
        serviceNumber: {
          type: Sequelize.STRING,
        },
        staffNumber: {
          type: Sequelize.STRING,
        },
        title: {
          type: Sequelize.STRING,
        },
        designation: {
          type: Sequelize.STRING,
        },
        armOfService: {
          type: Sequelize.STRING,
        },
        department: {
          type: Sequelize.STRING,
        },
        employer: {
          type: Sequelize.STRING,
        },
        dateOfBirth: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        gender: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        maritalStatus: {
          type: Sequelize.STRING,
        },
        idType: {
          type: Sequelize.STRING,
        },
        idNumber: {
          type: Sequelize.STRING,
        },
        sponsor: {
          type: Sequelize.STRING,
        },
        sponsorIdNumber: {
          type: Sequelize.STRING,
        },
        serviceStatus: {
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
  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Enrollees');
  },
};
