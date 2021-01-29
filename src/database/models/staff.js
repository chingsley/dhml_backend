'use strict';

const { throwError } = require('../../shared/helpers');

module.exports = (sequelize, DataTypes) => {
  const Staff = sequelize.define(
    'Staff',
    {
      staffIdNo: {
        allowNull: false,
        type: DataTypes.STRING,
        unique: true,
      },
      staffFileNo: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
      },
      surname: {
        type: DataTypes.STRING,
      },
      firstName: {
        type: DataTypes.STRING,
      },
      middleName: {
        type: DataTypes.STRING,
      },
      gender: {
        type: DataTypes.STRING,
      },
      permanentHomeAddress: {
        type: DataTypes.TEXT,
      },
      contactAddress: {
        type: DataTypes.TEXT,
      },
      dateOfBirth: {
        type: DataTypes.DATE,
      },
      placeOfBirth: {
        type: DataTypes.STRING,
      },
      homeTown: {
        type: DataTypes.STRING,
      },
      lga: {
        type: DataTypes.STRING,
      },
      stateOfOrigin: {
        type: DataTypes.STRING,
      },
      maritalStatus: {
        type: DataTypes.STRING,
      },
      numberOfChildren: {
        type: DataTypes.INTEGER,
      },
      phoneNumber: {
        type: DataTypes.STRING,
      },
      firstAppointment: {
        type: DataTypes.STRING,
      },
      dateOfFirstAppointment: {
        type: DataTypes.DATE,
      },
      gradeLevelOnFirstAppointment: {
        type: DataTypes.STRING,
      },
      presentAppointment: {
        type: DataTypes.STRING,
      },
      dateOfPresentAppointment: {
        type: DataTypes.DATE,
      },
      presentGradeLevel: {
        type: DataTypes.STRING,
      },
      designation: {
        type: DataTypes.STRING,
      },
      departmentOrUnit: {
        type: DataTypes.STRING,
      },
      deployment: {
        type: DataTypes.STRING,
      },
      location: {
        type: DataTypes.STRING,
      },
      jobSchedule: {
        type: DataTypes.STRING,
      },
      dateOfConfirmation: {
        type: DataTypes.DATE,
      },
      salaryPerAnnum: {
        type: DataTypes.STRING,
      },
      bank: {
        type: DataTypes.STRING,
      },
      branch: {
        type: DataTypes.STRING,
      },
      pfa: {
        type: DataTypes.STRING,
      },
      dateOfJoiningDhmlCooperativeSociety: {
        type: DataTypes.DATE,
      },
      primarySchoolAttended: {
        type: DataTypes.TEXT,
      },
      secondarySchoolAttended: {
        type: DataTypes.TEXT,
      },
      tertiaryIntitutionAttended: {
        type: DataTypes.TEXT,
      },
      qualifications: {
        type: DataTypes.STRING,
      },
      nameOfPreviousEmployer: {
        type: DataTypes.STRING,
      },
      positionHeld: {
        type: DataTypes.STRING,
      },
      jobScheduleAtPreviousEmployment: {
        type: DataTypes.STRING,
      },
      reasonForDisengagement: {
        type: DataTypes.STRING,
      },
      dateOfDisengagement: {
        type: DataTypes.DATE,
      },
      hodRemarks: {
        type: DataTypes.TEXT,
      },
      mdComment: {
        type: DataTypes.TEXT,
      },
      nextOfKin: {
        type: DataTypes.STRING,
      },
      relationshipWithNok: {
        type: DataTypes.STRING,
      },
      addressOfNok: {
        type: DataTypes.TEXT,
      },
      phoneNumberOfNok: {
        type: DataTypes.STRING,
      },
    },
    {}
  );
  Staff.associate = function (models) {
    Staff.hasOne(models.User, {
      foreignKey: 'staffId',
      as: 'userInfo',
    });
  };
  Staff.findByStaffIdNo = async function (staffIdNo, options) {
    const {
      throwErrorIfNotFound,
      errorMsg = `Record not found. No staff matches the ID of ${staffIdNo}`,
    } = options;
    const found = await this.findOne({
      where: { staffIdNo },
    });
    if (!found && throwErrorIfNotFound) {
      throwError({
        status: 400,
        error: [errorMsg],
        errorCode: options.errorCode,
      });
    }
    return found;
  };
  return Staff;
};
