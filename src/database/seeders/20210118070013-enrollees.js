const { getEnrollees } = require('../../shared/samples/enrollee.samples');

const { principals, dependants } = getEnrollees();
module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: (queryInterface, Sequelize) => {
    // return queryInterface.bulkInsert('Roles', sampleRoles);
    return Promise.all([
      queryInterface.bulkInsert('Enrollees', principals),
      queryInterface.bulkInsert('Enrollees', dependants),
    ]);
  },

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    // return queryInterface.bulkDelete('Roles', null, {});
    return Promise.all([
      queryInterface.bulkDelete('Enrollees', null, {}),
      // queryInterface.bulkDelete('Principals', null, {}),
    ]);
  },
};
