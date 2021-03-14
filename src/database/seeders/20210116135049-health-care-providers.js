'use strict';

const dotenv = require('dotenv');
dotenv.config();

let getSampleHCPs, ROLES, roleId, HCPs;

if (process.env.SEED_WITH === 'LIVE_DATA') {
  HCPs = require('../../../live_data/HealthCareProviders.json');
} else {
  getSampleHCPs = require('../../shared/samples/hcp.samples');
  ROLES = require('../../shared/constants/roles.constants');

  roleId = Object.keys(ROLES).indexOf('HCP') + 1;
  HCPs = getSampleHCPs().map((hcp) => ({
    ...hcp,
    status: 'active',
    roleId,
  }));
}

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('HealthCareProviders', HCPs);
  },

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('HealthCareProviders', null, {});
  },
};
