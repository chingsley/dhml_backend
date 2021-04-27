const db = require('../models');
const {
  getSampleUserPasswords,
  getSampleHcpPasswords,
} = require('../../shared/samples/password.samples');

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
    return queryInterface.bulkInsert('Passwords', samplePasswords);
  },

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Passwords', null, {});
  },
};
