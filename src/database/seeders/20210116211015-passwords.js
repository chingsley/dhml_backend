const { getSamplePasswords } = require('../../shared/samples/password.samples');

const samplePasswords = getSamplePasswords('Testing*123');

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
