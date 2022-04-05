'use strict';
const faker = require('faker');
const { v4: uuidv4 } = require('uuid');
const { _random, randNum } = require('../../utils/helpers');
const db = require('../models');
const diagnosis = require('../../../diagnosisFile.json');
const { months } = require('../../utils/timers');
const { loggNodeEnvWarning } = require('../helpers');

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: async (queryInterface, Sequelize) => {
    const enrollees = await db.Enrollee.findAll({ attributes: ['id'] });
    const hcps = await db.HealthCareProvider.findAll({ attributes: ['id'] });
    const encounters = Array.from(Array(50000).keys()).map(() => {
      return {
        id: uuidv4(),
        enrolleeId: _random(enrollees).id,
        hcpId: _random(hcps).id,
        diagnosis: _random(diagnosis).value,
        cost: randNum(1000, 10000),
        prescription: faker.lorem.text(),
        isRepeatVisit: _random([true, false]),
        isReferalVisit: _random([true, false]),
        createdAt: months.setPast(randNum(0, 12)),
      };
    });
    try {
      await queryInterface.bulkInsert('Encounters', encounters);
    } catch (error) {
      loggNodeEnvWarning(error.message);
    }
  },

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Encounters', null, {});
  },
};
