'use strict';
import { QueryTypes } from 'sequelize';
import { getCapitationWithoutZeroStats } from '../scripts/hcp.scripts';

module.exports = (sequelize, DataTypes) => {
  const HcpMonthlyCapitation = sequelize.define(
    'HcpMonthlyCapitation',
    {
      hcpId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: 'HealthCareProviders',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      month: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      rrr: {
        type: DataTypes.STRING,
      },
      tsaCharge: {
        type: DataTypes.DOUBLE,
      },
      lives: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      gmcId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: 'GeneralMonthlyCapitations',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
    },
    {}
  );
  HcpMonthlyCapitation.associate = function (models) {
    HcpMonthlyCapitation.belongsTo(models.HealthCareProvider, {
      foreignKey: 'hcpId',
      as: 'hcp',
    });
    HcpMonthlyCapitation.belongsTo(models.GeneralMonthlyCapitation, {
      foreignKey: 'gmcId',
      as: 'generalMonthlyCapitation',
    });
  };
  HcpMonthlyCapitation.runScript = async function (
    queryFunction,
    reqQuery,
    key
  ) {
    const { dialect, database } = sequelize.options;
    const rows = await sequelize.query(
      queryFunction(dialect, database, reqQuery),
      {
        type: QueryTypes.SELECT,
      }
    );
    if (key) {
      return { [key]: rows };
    } else {
      return rows;
    }
  };
  HcpMonthlyCapitation.addMonthlyRecord = async function (gmcRecord, t) {
    const { month, id: gmcId } = gmcRecord;
    const results = await this.runScript(getCapitationWithoutZeroStats, {
      date: month,
    });
    const hcpCaps = results.map((result) => ({
      lives: result.lives,
      amount: result.amount,
      hcpId: result.hcpId,
      month,
      gmcId,
    }));
    await this.bulkCreate(hcpCaps, { transaction: t });
  };

  HcpMonthlyCapitation.deleteMonthRecord = async function (gmcRecord, t) {
    await this.destroy({ where: { gmcId: gmcRecord.id }, transaction: t });
  };
  return HcpMonthlyCapitation;
};
