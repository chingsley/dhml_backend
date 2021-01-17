const faker = require('faker');
const { getRandomInt } = require('../../utils/helpers');
const { MAX_USER_COUNT } = require('../config');
const ROLES = require('../constants/roles.contants');
const rolesCount = Object.keys(ROLES).length;

const { internet } = faker;
const { getSampleStaffList } = require('./staff.samples');

const getSampleUsers = (count = MAX_USER_COUNT) => {
  const sampleStaffList = getSampleStaffList(count);
  const sampleUsers = sampleStaffList.map((staff) => ({
    staffIdNo: staff.staffIdNo,
    email: internet.email(staff.firstName),
    username: internet.userName(staff.firstName),
    roleId: getRandomInt(rolesCount + 1, { min: 1 }),
    hasChangedDefaultPassword: true,
  }));
  return { sampleStaffList, sampleUsers };
};

module.exports = { getSampleUsers };
Array.from(Array(rolesCount + 1).keys());
