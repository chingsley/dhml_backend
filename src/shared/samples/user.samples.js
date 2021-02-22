const faker = require('faker');
const ROLES = require('../constants/roles.constants');
const userRoles = Object.keys(ROLES).filter((role) => role !== 'HCP');

const { internet } = faker;

const getSampleUsers = (staffs) => {
  const sampleUsers = staffs.map((staff, index) => {
    const randomUserRole = faker.random.arrayElement(userRoles);
    const indexOfRandomUserRole = userRoles.indexOf(randomUserRole);
    return {
      staffId: index + 1,
      username: internet.userName(staff.firstName),
      roleId: indexOfRandomUserRole + 1,
    };
  });
  return { sampleUsers };
};

module.exports = getSampleUsers;
