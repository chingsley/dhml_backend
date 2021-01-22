'use strict';
const getSampleHCPs = require('../../shared/samples/hcp.samples');
// const { downcaseAllFields } = require('../../utils/helpers');
// const hcps = getSampleHCPs();
// const HCPsInLowerCase = downcaseAllFields(hcps);

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('HealthCareProviders', getSampleHCPs());
  },

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('HealthCareProviders', null, {});
  },
};
