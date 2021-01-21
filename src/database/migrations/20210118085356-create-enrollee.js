'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'Enrollees',
      {
        id: {
          allowNull: false,
          unique: true,
          primaryKey: true,
          type: Sequelize.STRING,
        },
        principalId: {
          type: Sequelize.STRING,
          references: {
            model: 'Enrollees',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        relationshipToPrincipal: {
          type: Sequelize.STRING,
        },
        dependantClass: {
          type: Sequelize.STRING,
        },
        dependantType: {
          type: Sequelize.STRING,
        },
        hcpId: {
          allowNull: false,
          type: Sequelize.INTEGER,
          references: {
            model: 'HealthCareProviders',
            key: 'id',
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
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
          unique: true,
          allowNull: true,
        },
        staffNumber: {
          type: Sequelize.STRING,
          unique: true,
          allowNull: true,
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
        identificationType: {
          type: Sequelize.STRING, // idType
        },
        identificationNumber: {
          type: Sequelize.STRING, // idNumber
        },
        serviceStatus: {
          type: Sequelize.STRING,
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
        bloodGroup: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        significantMedicalHistory: {
          type: Sequelize.STRING,
        },
        photograph: {
          type: Sequelize.STRING,
        },
        birthCertificate: {
          type: Sequelize.STRING,
        },
        marriageCertificate: {
          type: Sequelize.STRING,
        },
        idCard: {
          type: Sequelize.STRING,
        },
        deathCertificate: {
          type: Sequelize.STRING,
        },
        letterOfNok: {
          type: Sequelize.STRING,
        },
        isVerified: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
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
