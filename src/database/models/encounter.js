'use strict';
module.exports = (sequelize, DataTypes) => {
  const Encounter = sequelize.define(
    'Encounter',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      enrolleeId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Enrollees',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      hcpId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'HealthCareProviders',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      diagnosis: {
        type: DataTypes.STRING,
      },
      cost: {
        type: DataTypes.DECIMAL,
      },
      prescription: {
        type: DataTypes.TEXT,
      },
      isRepeatVisit: {
        type: DataTypes.BOOLEAN,
      },
      isReferalVisit: {
        type: DataTypes.BOOLEAN,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {}
  );
  Encounter.associate = function (models) {
    Encounter.belongsTo(models.Enrollee, {
      foreignKey: 'enrolleeId',
      as: 'enrollee',
    });
    Encounter.belongsTo(models.HealthCareProvider, {
      foreignKey: 'hcpId',
      as: 'hcp',
    });
  };
  return Encounter;
};
