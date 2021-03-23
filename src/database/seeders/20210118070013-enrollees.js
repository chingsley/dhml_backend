const dotenv = require('dotenv');
const faker = require('faker');
const { months, days } = require('../../utils/timers');
dotenv.config();
const db = require('../models');
const SampleReferalCodes = require('../../shared/samples/refcode.samples');

if (process.env.SEED_WITH === 'LIVE_DATA') {
  const enrollees = require('../../../live_data/Enrollees.json');
  const { principals, dependants } = enrollees.reduce(
    (acc, enrollee) => {
      if (enrollee.principalId === null) {
        acc.principals.push({
          ...enrollee,
          isVerified: true,
          dateVerified: faker.date.between(months.setPast(4), days.today),
        });
      } else {
        acc.dependants.push(enrollee);
      }
      return acc;
    },
    { principals: [], dependants: [] }
  );

  module.exports = {
    // eslint-disable-next-line no-unused-vars
    up: async (queryInterface, Sequelize) => {
      await queryInterface.bulkInsert('Enrollees', principals);
      const seededPrincipals = await db.Enrollee.findAll({
        where: { principalId: null },
      });
      const dictPrincipalId = seededPrincipals.reduce((acc, p) => {
        acc[p.enrolleeIdNo] = p;
        return acc;
      }, {});
      const dependantsWithPrincipalId = dependants.map((d) => {
        const principalEnrolleeIdNo = d.enrolleeIdNo.split('-')[0];
        return {
          ...d,
          principalId: dictPrincipalId[principalEnrolleeIdNo].id,
          isVerified: dictPrincipalId[principalEnrolleeIdNo].isVerified,
          dateVerified: dictPrincipalId[principalEnrolleeIdNo].dateVerified,
        };
      });
      await queryInterface.bulkInsert('Enrollees', dependantsWithPrincipalId);
      const referalCodes = await SampleReferalCodes.getSeed();
      await queryInterface.bulkInsert('ReferalCodes', referalCodes);
    },

    // eslint-disable-next-line no-unused-vars
    down: async (queryInterface, Sequelize) => {
      await queryInterface.bulkDelete('ReferalCodes', null, {});
      await queryInterface.bulkDelete('Enrollees', null, {});
    },
  };
} else {
  const {
    MAX_PRINCIPALS_COUNT,
  } = require('../../shared/constants/seeders.constants');
  const getEnrollees = require('../../shared/samples/enrollee.samples');

  const { principals, dependants } = getEnrollees({
    numOfPrincipals: MAX_PRINCIPALS_COUNT,
    sameSchemeDepPerPrincipal: 2,
    vcshipDepPerPrincipal: 1,
  });

  module.exports = {
    // eslint-disable-next-line no-unused-vars
    up: async (queryInterface, Sequelize) => {
      await queryInterface.bulkInsert('Enrollees', principals);
      await queryInterface.bulkInsert('Enrollees', dependants);
      const referalCodes = await SampleReferalCodes.getSeed();
      await queryInterface.bulkInsert('ReferalCodes', referalCodes);
    },

    // eslint-disable-next-line no-unused-vars
    down: async (queryInterface, Sequelize) => {
      await queryInterface.bulkDelete('ReferalCodes', null, {});
      await queryInterface.bulkDelete('Enrollees', null, {});
    },
  };
}
