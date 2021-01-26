const {
  MAX_PRINCIPALS_COUNT,
} = require('../../shared/constants/seeders.constants');
const getEnrollees = require('../../shared/samples/enrollee.samples');
// const { downcaseAllFields } = require('../../utils/helpers');

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
  },

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return Promise.all([queryInterface.bulkDelete('Enrollees', null, {})]);
  },
};
