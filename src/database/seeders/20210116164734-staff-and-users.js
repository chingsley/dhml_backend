const { MAX_USER_COUNT } = require('../../shared/constants/seeders.constants');
const getSampleStaffs = require('../../shared/samples/staff.samples');
const getSampleUsers = require('../../shared/samples/user.samples');
const db = require('../models');
// const { downcaseAllFields } = require('../../utils/helpers');

const { sampleStaffs } = getSampleStaffs();
const { sampleUsers } = getSampleUsers(sampleStaffs.slice(0, MAX_USER_COUNT));

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Staffs', [
      { ...sampleStaffs[0], email: 'info.erregen@gmail.com' },
      ...sampleStaffs.slice(1),
    ]);
    const mdRole = await db.Role.findOne({ where: { title: 'md' } });
    await queryInterface.bulkInsert('Users', [
      { ...sampleUsers[0], roleId: mdRole.id, username: 'erregen' },
      ...sampleUsers.slice(1),
    ]);
  },

  // eslint-disable-next-line no-unused-vars
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Staffs', null, {});
  },
};
