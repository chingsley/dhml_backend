const getSampleStaffs = require('../../shared/samples/staff.samples');
const getSampleUsers = require('../../shared/samples/user.samples');

const { sampleStaffs } = getSampleStaffs();
const { sampleUsers } = getSampleUsers(
  sampleStaffs.slice(0, Math.floor(sampleStaffs.length / 2))
);

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Staffs', sampleStaffs);
    await queryInterface.bulkInsert('Users', sampleUsers);
  },

  // eslint-disable-next-line no-unused-vars
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Staffs', null, {});
  },
};
