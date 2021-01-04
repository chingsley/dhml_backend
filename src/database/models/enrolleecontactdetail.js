'use strict';
module.exports = (sequelize, DataTypes) => {
  const EnrolleeContactDetail = sequelize.define(
    'EnrolleeContactDetail',
    {
      enrolleeId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: 'Enrollees',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      phoneNumber: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
      },
      residentialAddress: {
        type: DataTypes.STRING,
      },
      stateOfResidence: {
        type: DataTypes.STRING,
      },
      lga: {
        type: DataTypes.STRING,
      },
    },
    {}
  );
  // eslint-disable-next-line no-unused-vars
  EnrolleeContactDetail.associate = function (models) {
    // associations can be defined here
  };
  return EnrolleeContactDetail;
};
