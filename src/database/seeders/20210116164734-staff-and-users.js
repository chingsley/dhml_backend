const { MAX_USER_COUNT } = require('../../shared/constants/seeders.constants');
const getSampleStaffs = require('../../shared/samples/staff.samples');
const getSampleUsers = require('../../shared/samples/user.samples');
const db = require('../models');
const ROLES = require('../../shared/constants/roles.constants');

const { sampleStaffs } = getSampleStaffs();
const { sampleUsers } = getSampleUsers(sampleStaffs.slice(0, MAX_USER_COUNT));
const { log } = console;
const staffCount = sampleStaffs.length;
const userCount = sampleUsers.length;
const ERREGEN = {
  email: 'info.erregen@gmail.com',
  username: 'erregen',
};

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: async (queryInterface, Sequelize) => {
    const rolesInDb = await db.Role.findAll();
    const { customStaffs, customUsers } = rolesInDb
      .filter((role) => role.title !== ROLES.HCP)
      .reduce(
        (acc, role, index) => {
          // log(role.title, index);
          acc.customStaffs.push({
            ...sampleStaffs[index],
            email: role.title.split(' ').join('_') + '@gmail.com',
          });
          acc.customUsers.push({
            ...sampleUsers[index],
            username: role.title.toUpperCase(),
            roleId: role.id,
          });
          return acc;
        },
        {
          customStaffs: [],
          customUsers: [],
        }
      );
    try {
      await queryInterface.bulkInsert('Staffs', [
        ...customStaffs,
        ...sampleStaffs.slice(customStaffs.length, staffCount - 1),
        {
          ...sampleStaffs[staffCount - 1],
          email: ERREGEN.email,
        },
      ]);
    } catch (error) {
      log('migrating Staffs: ', error.errors);
    }

    try {
      // const mdRole = await db.Role.findAll();
      const mdRole = rolesInDb.find((role) => role.title === ROLES.MD);
      const erregenStaff = await db.Staff.findOne({
        where: { email: ERREGEN.email },
      });
      await queryInterface.bulkInsert('Users', [
        ...customUsers,
        ...sampleUsers.slice(customUsers.length, userCount - 1),
        {
          ...sampleUsers[userCount - 1],
          roleId: mdRole.id,
          username: ERREGEN.username,
          staffId: erregenStaff.id,
        },
      ]);
    } catch (error) {
      log('migrating Users: ', error.errors);
    }
  },

  // eslint-disable-next-line no-unused-vars
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Staffs', null, {});
  },
};
