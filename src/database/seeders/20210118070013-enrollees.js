const dotenv = require('dotenv');
dotenv.config();

const SampleReferalCodes = require('../../shared/samples/refcode.samples');

if (process.env.SEED_WITH === 'LIVE_DATA') {
  const enrollees = require('../../../live_data/Enrollees.json');

  module.exports = {
    // eslint-disable-next-line no-unused-vars
    up: async (queryInterface, Sequelize) => {
      await queryInterface.bulkInsert('Enrollees', enrollees);
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
