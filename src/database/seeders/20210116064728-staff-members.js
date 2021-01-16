const getSampleStaffList = require('../../shared/samples/staff.samples');

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Staffs', getSampleStaffList(50));
  },

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Staffs', null, {});
  },
};
