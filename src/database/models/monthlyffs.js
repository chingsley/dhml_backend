'use strict';
module.exports = (sequelize, DataTypes) => {
  const MonthlyFFSPayment = sequelize.define(
    'MonthlyFFSPayment',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      month: {
        type: DataTypes.DATE,
      },
      totalClaims: {
        type: DataTypes.INTEGER,
      },
      amount: {
        type: DataTypes.DECIMAL,
      },
      dateAudited: {
        type: DataTypes.DATE,
      },
      auditStatus: {
        type: DataTypes.STRING,
      },
      flagReason: {
        type: DataTypes.TEXT,
      },
      dateApproved: {
        type: DataTypes.DATE,
      },
      datePaid: {
        type: DataTypes.DATE,
      },
    },
    {}
  );
  MonthlyFFSPayment.associate = function (models) {
    MonthlyFFSPayment.hasMany(models.HcpMonthlyFFSPayment, {
      foreignKey: 'mfpId',
      as: 'hcpMonthlyFFSPayments',
    });
  };
  return MonthlyFFSPayment;
};
