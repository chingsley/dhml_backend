const {
  getSampleUserPasswords,
  getSampleHcpPasswords,
} = require('../../shared/samples/password.samples');
const getSampleHCPs = require('../../shared/samples/hcp.samples');

const hcpLength = getSampleHCPs().length;

const sampleUserPasswords = getSampleUserPasswords('Testing*123');
const sampleHcpPasswords = getSampleHcpPasswords('Testing*123', hcpLength);
const samplePasswords = [...sampleUserPasswords, ...sampleHcpPasswords];

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Passwords', samplePasswords);
  },

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Passwords', null, {});
  },
};
