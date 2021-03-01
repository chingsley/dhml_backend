const {
  MAX_PRINCIPALS_COUNT,
} = require('../../shared/constants/seeders.constants');
const getEnrollees = require('../../shared/samples/enrollee.samples');
const SampleReferalCodes = require('../../shared/samples/refcode.samples');

const { principals, dependants } = getEnrollees({
  numOfPrincipals: MAX_PRINCIPALS_COUNT,
  sameSchemeDepPerPrincipal: 2,
  vcshipDepPerPrincipal: 1,
});

const referalCodes = SampleReferalCodes.getSeed([...principals, ...dependants]);

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Enrollees', principals);
    await queryInterface.bulkInsert('Enrollees', dependants);
    await queryInterface.bulkInsert('ReferalCodes', referalCodes);
  },

  // eslint-disable-next-line no-unused-vars
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('ReferalCodes', null, {});
    await queryInterface.bulkDelete('Enrollees', null, {});
  },
};
