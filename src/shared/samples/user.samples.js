const faker = require('faker');
const { getRandomInt } = require('../../utils/helpers');
const ROLES = require('../constants/roles.constants');
const rolesCount = Object.keys(ROLES).length;

const { internet } = faker;

const getSampleUsers = (staffs) => {
  const sampleUsers = staffs.map((staff, index) => ({
    staffId: index + 1,
    email: internet.email(staff.firstName),
    username: internet.userName(staff.firstName),
    roleId: getRandomInt(rolesCount + 1, { min: 1 }),
  }));
  return { sampleUsers };
};

module.exports = getSampleUsers;
