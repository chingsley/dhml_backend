'use strict';
const getSampleHCPs = require('../../shared/samples/hcp.samples');
const ROLES = require('../../shared/constants/roles.constants');

const roleId = Object.keys(ROLES).indexOf('HCP') + 1;

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(
      'HealthCareProviders',
      getSampleHCPs().map((hcp) => ({ ...hcp, status: 'active', roleId }))
    );
  },

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('HealthCareProviders', null, {});
  },
};
