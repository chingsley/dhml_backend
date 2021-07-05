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
        references: {
          model: 'ReferalCodes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      category: {
        type: DataTypes.STRING,
      },
      serviceName: {
        type: DataTypes.STRING,
      },
      drugName: {
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
      // amount: {
      //   type: DataTypes.DECIMAL,
      // },
      preparedBy: {
        // could be user or hcp so we can't use preparerId, as it will be referencing either hchp or user
        // for a user, preparedBy = user.staffInfo.staffIdNo
        // for hcp, preparedBy = hcp.code
        type: DataTypes.STRING,
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
