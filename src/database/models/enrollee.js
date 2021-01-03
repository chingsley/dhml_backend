'use strict';
module.exports = (sequelize, DataTypes) => {
  const Enrollee = sequelize.define(
    'Enrollee',
    {
      enrolleeIdNo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      scheme: {
        type: DataTypes.STRING,
      },
      surname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      middleName: {
        type: DataTypes.STRING,
      },
      rank: {
        type: DataTypes.STRING,
      },
      serviceNumber: {
        type: DataTypes.STRING,
      },
      staffNumber: {
        type: DataTypes.STRING,
      },
      title: {
        type: DataTypes.STRING,
      },
      designation: {
        type: DataTypes.STRING,
      },
      armOfService: {
        type: DataTypes.STRING,
      },
      department: {
        type: DataTypes.STRING,
      },
      employer: {
        type: DataTypes.STRING,
      },
      dateOfBirth: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      maritalStatus: {
        type: DataTypes.STRING,
      },
      idType: {
        type: DataTypes.STRING,
      },
      idNumber: {
        type: DataTypes.STRING,
      },
      sponsor: {
        type: DataTypes.STRING,
      },
      sponsorIdNumber: {
        type: DataTypes.STRING,
      },
      serviceStatus: {
        type: DataTypes.STRING,
      },
    },
    {}
  );
  // eslint-disable-next-line no-unused-vars
  Enrollee.associate = function (models) {
    // associations can be defined here
  };
  return Enrollee;
};
