const dotenv = require('dotenv');
dotenv.config();

let sampleRoles;

if (process.env.SEED_WITH === 'LIVE_DATA') {
  sampleRoles = require('../../../live_data/Roles.json');
} else {
  sampleRoles = require('../../shared/samples/role.samples');
}

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Roles', sampleRoles);
  },

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Roles', null, {});
  },
};
