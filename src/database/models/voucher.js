'use strict';
module.exports = (sequelize, DataTypes) => {
  const Voucher = sequelize.define(
    'Voucher',
    {
      gmcId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'GeneralMonthlyCapitations',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      department: {
        type: DataTypes.STRING,
      },
      acCode: {
        type: DataTypes.STRING,
      },
      pvNo: {
        type: DataTypes.STRING,
      },
      payee: {
        type: DataTypes.STRING,
      },
      serviceDate: {
        type: DataTypes.DATE,
      },
      serviceDescription: {
        type: DataTypes.TEXT,
      },
      preparedBy: {
        type: DataTypes.STRING,
      },
      preparerDesignation: {
        type: DataTypes.STRING,
      },
      datePrepared: {
        type: DataTypes.DATE,
      },
      authorizedBy: {
        type: DataTypes.STRING,
      },
      authorizerDesignation: {
        type: DataTypes.STRING,
      },
      dateAuthorized: {
        type: DataTypes.DATE,
      },
    },
    {}
  );
  Voucher.associate = function (models) {
    Voucher.belongsTo(models.GeneralMonthlyCapitation, {
      foreignKey: 'gmcId',
      as: 'capitation',
    });
  };
  Voucher.updateOrCreate = async function (record) {
    const { gmcId } = record;
    await this.upsert(record);
    return this.findOne({
      where: { gmcId },
      include: [
        {
          model: this.sequelize.models.GeneralMonthlyCapitation,
          as: 'capitation',
        },
      ],
    });
  };
  return Voucher;
};
