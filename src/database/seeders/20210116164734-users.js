const getSampleStaffAndUsers = require('../../shared/samples/staff.samples');

const { sampleStaffList, sampleUsers } = getSampleStaffAndUsers();

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Staffs', sampleStaffList);
    await queryInterface.bulkInsert('Users', sampleUsers);
  },

  // eslint-disable-next-line no-unused-vars
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Staffs', null, {});
  },
};
