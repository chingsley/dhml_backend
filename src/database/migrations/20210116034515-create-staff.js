'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'Staffs',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        staffFileNo: {
          type: Sequelize.STRING,
        },
        staffIdNo: {
          allowNull: false,
          type: Sequelize.STRING,
          unique: true,
        },
        email: {
          type: Sequelize.STRING,
        },
        surname: {
          type: Sequelize.STRING,
        },
        firstName: {
          type: Sequelize.STRING,
        },
        middleName: {
          type: Sequelize.STRING,
        },
        gender: {
          type: Sequelize.STRING,
        },
        permanentHomeAddress: {
          type: Sequelize.TEXT,
        },
        contactAddress: {
          type: Sequelize.TEXT,
        },
        dateOfBirth: {
          type: Sequelize.DATE,
        },
        placeOfBirth: {
          type: Sequelize.STRING,
        },
        homeTown: {
          type: Sequelize.STRING,
        },
        lga: {
          type: Sequelize.STRING,
        },
        stateOfOrigin: {
          type: Sequelize.STRING,
        },
        maritalStatus: {
          type: Sequelize.STRING,
        },
        numberOfChildren: {
          type: Sequelize.INTEGER,
        },
        phoneNumber: {
          type: Sequelize.STRING,
        },
        firstAppointment: {
          type: Sequelize.STRING,
        },
        dateOfFirstAppointment: {
          type: Sequelize.DATE,
        },
        gradeLevelOnFirstAppointment: {
          type: Sequelize.STRING,
        },
        presentAppointment: {
          type: Sequelize.STRING,
        },
        dateOfPresentAppointment: {
          type: Sequelize.DATE,
        },
        presentGradeLevel: {
          type: Sequelize.STRING,
        },
        designation: {
          type: Sequelize.STRING,
        },
        departmentOrUnit: {
          type: Sequelize.STRING,
        },
        deployment: {
          type: Sequelize.STRING,
        },
        location: {
          type: Sequelize.STRING,
        },
        jobSchedule: {
          type: Sequelize.STRING,
        },
        dateOfConfirmation: {
          type: Sequelize.DATE,
        },
        salaryPerAnnum: {
          type: Sequelize.STRING,
        },
        bank: {
          type: Sequelize.STRING,
        },
        branch: {
          type: Sequelize.STRING,
        },
        pfa: {
          type: Sequelize.STRING,
        },
        dateOfJoiningDhmlCooperativeSociety: {
          type: Sequelize.DATE,
        },
        primarySchoolAttended: {
          type: Sequelize.TEXT,
        },
        secondarySchoolAttended: {
          type: Sequelize.TEXT,
        },
        tertiaryIntitutionAttended: {
          type: Sequelize.TEXT,
        },
        qualifications: {
          type: Sequelize.STRING,
        },
        nameOfPreviousEmployer: {
          type: Sequelize.STRING,
        },
        positionHeld: {
          type: Sequelize.STRING,
        },
        jobScheduleAtPreviousEmployment: {
          type: Sequelize.STRING,
        },
        reasonForDisengagement: {
          type: Sequelize.STRING,
        },
        dateOfDisengagement: {
          type: Sequelize.DATE,
        },
        hodRemarks: {
          type: Sequelize.TEXT,
        },
        mdComment: {
          type: Sequelize.TEXT,
        },
        nextOfKin: {
          type: Sequelize.STRING,
        },
        relationshipWithNok: {
          type: Sequelize.STRING,
        },
        addressOfNok: {
          type: Sequelize.TEXT,
        },
        phoneNumberOfNok: {
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
    return queryInterface.dropTable('Staffs');
  },
};
