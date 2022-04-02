const db = require('../models');
const {
  getSampleUserPasswords,
  getSampleHcpPasswords,
} = require('../../shared/samples/password.samples');
const { loggNodeEnvWarning } = require('../helpers');

// const hcpLength = getSampleHCPs().length;

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: async (queryInterface, Sequelize) => {
    const usersCount = await db.User.count();
    const sampleUserPasswords = getSampleUserPasswords(
      'Testing*123',
      usersCount
    );
    const hcpCount = await db.HealthCareProvider.count();
    const sampleHcpPasswords = getSampleHcpPasswords('Testing*123', hcpCount);
    const samplePasswords = [...sampleUserPasswords, ...sampleHcpPasswords];
    try {
      await queryInterface.bulkInsert('Passwords', samplePasswords);
    } catch (error) {
      loggNodeEnvWarning(error.message);
    }
  },

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Passwords', null, {});
  },
};
