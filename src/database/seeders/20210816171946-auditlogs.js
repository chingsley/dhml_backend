'use strict';
const faker = require('faker');
const { v4: uuidv4 } = require('uuid');
const { _random, randNum } = require('../../utils/helpers');
const db = require('../models');
const { months } = require('../../utils/timers');

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: async (queryInterface, Sequelize) => {
    const hcps = await db.HealthCareProvider.findAll();
    const users = await db.User.findAll({
      include: {
        model: db.Staff,
        as: 'staffInfo',
      },
    });
    const auditLogs = Array.from(Array(50000).keys()).map((_, index) => {
      let userId = null;
      let hcpId = null;
      let name = '';
      if (index % 2 === 0) {
        const user = _random(users);
        const { staffInfo } = user;
        userId = user.id;
        name = `${staffInfo.firstName} ${staffInfo.surname} (${staffInfo.staffIdNo})`;
      } else {
        const hcp = _random(hcps);
        hcpId = hcp.id;
        name = hcp.name;
      }

      return {
        id: uuidv4(),
        userId,
        hcpId,
        name,
        action: faker.lorem.text(),
        createdAt: months.setPast(randNum(0, 12)),
      };
    });
    return queryInterface.bulkInsert('AuditLogs', auditLogs);
  },

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('AuditLogs', null, {});
  },
};
