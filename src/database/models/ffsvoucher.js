'use strict';
const { ACCOUNTANT_NAME, ACCOUNTANT_SIGNATURE } = process.env;

module.exports = (sequelize, DataTypes) => {
  const FFSVoucher = sequelize.define(
    'FFSVoucher',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      mfpId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'MonthlyFFSPayments',
          key: 'id',
        },
        onDelete: 'RESTRICT',
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
      address: {
        type: DataTypes.STRING,
      },
      amountInWords: {
        type: DataTypes.TEXT,
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
      accountantName: {
        type: DataTypes.VIRTUAL,
        get() {
          return ACCOUNTANT_NAME;
        },
      },
      accountantSignature: {
        type: DataTypes.VIRTUAL,
        get() {
          return ACCOUNTANT_SIGNATURE;
        },
      },
    },
    {}
  );
  FFSVoucher.associate = function (models) {
    FFSVoucher.belongsTo(models.MonthlyFFSPayment, {
      foreignKey: 'mfpId',
      as: 'monthlyFFS',
    });
  };
  FFSVoucher.updateOrCreate = async function (mfpId, record) {
    let voucher = await this.findOne({
      where: { mfpId },
      include: [
        {
          model: this.sequelize.models.MonthlyFFSPayment,
          as: 'monthlyFFS',
        },
      ],
    });
    if (voucher) {
      await voucher.update(record);
    } else {
      voucher = await this.create({ ...record, mfpId });
    }
    return voucher;
  };
  return FFSVoucher;
};
