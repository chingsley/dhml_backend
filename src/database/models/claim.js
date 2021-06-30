'use strict';
module.exports = (sequelize, DataTypes) => {
  const Claim = sequelize.define(
    'Claim',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      refcodeId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
      },
      serviceName: {
        type: DataTypes.STRING,
      },
      drugDosageForm: {
        type: DataTypes.STRING,
      },
      drugStrength: {
        type: DataTypes.STRING,
      },
      drugPresentation: {
        type: DataTypes.STRING,
      },
      unit: {
        type: DataTypes.INTEGER,
      },
      pricePerUnit: {
        type: DataTypes.DECIMAL,
      },
      amount: {
        type: DataTypes.DECIMAL,
      },
    },
    {}
  );
  Claim.associate = function (models) {
    Claim.belongsTo(models.ReferalCode, {
      foreignKey: 'refcodeId',
      as: 'referalCode',
    });
  };
  return Claim;
};
