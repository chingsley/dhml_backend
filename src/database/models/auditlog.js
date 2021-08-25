'use strict';
const { log } = console;

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
      },
      hcpId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'HealthCareProviders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      action: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {}
  );
  AuditLog.associate = function (models) {
    AuditLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  AuditLog.logAction = async function ({ operator, action }) {
    try {
      const auditLog = { action, role: operator.role.title };
      const { userType } = operator;

      if (userType.toLowerCase() === 'user') {
        const { firstName, surname, staffIdNo } = operator.staffInfo;
        auditLog.userId = operator.id;
        auditLog.name = `${firstName} ${surname} (${staffIdNo})`;
      } else if (userType.toLowerCase() === 'hcp') {
        const { name, code } = operator;
        auditLog.hcpId = operator.id;
        auditLog.name = `${name} (${code})`;
      } else {
        throw new Error(
          `AuditLog.createLog() expects operator.userType to be 'user' or 'hcp', but got ${userType}`
        );
      }
      await this.create(auditLog);
    } catch (error) {
      log('AuditLog.logAction: ', error);
    }
  };
  return AuditLog;
};
