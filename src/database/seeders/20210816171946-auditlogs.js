'use strict';
const faker = require('faker');
const { v4: uuidv4 } = require('uuid');
const { _random, randNum } = require('../../utils/helpers');
const db = require('../models');
const { months } = require('../../utils/timers');
const { loggNodeEnvWarning } = require('../helpers');

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: async (queryInterface, Sequelize) => {
    const hcps = await db.HealthCareProvider.findAll({
      include: { model: db.Role, as: 'role' },
    });
    const users = await db.User.findAll({
      include: [
        {
          model: db.Staff,
          as: 'staffInfo',
        },
        {
          model: db.Role,
          as: 'role',
        },
      ],
    });
    const auditLogs = Array.from(Array(10000).keys()).map((_, index) => {
      const auditLog = {
        id: uuidv4(),
        action: faker.lorem.text(),
        createdAt: months.setPast(randNum(0, 12)),
      };
      if (index % 2 === 0) {
        const user = _random(users);
        const { staffInfo } = user;
        auditLog.userId = user.id;
        auditLog.name = `${staffInfo.firstName} ${staffInfo.surname} (${staffInfo.staffIdNo})`;
        auditLog.role = user.role.title;
      } else {
        const hcp = _random(hcps);
        auditLog.hcpId = hcp.id;
        auditLog.name = `${hcp.name} (${hcp.code})`;
        auditLog.role = hcp.role.title;
      }
      return auditLog;
    });
    try {
      await queryInterface.bulkInsert('AuditLogs', auditLogs);
    } catch (error) {
      loggNodeEnvWarning(error.message);
    }
  },

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('AuditLogs', null, {});
  },
};
