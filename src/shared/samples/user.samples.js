const faker = require('faker');

const { internet } = faker;
const { getSampleStaffList, MAX_STAFF_COUNT } = require('./staff.samples');

const getSampleUsers = (count = MAX_STAFF_COUNT) => {
  const sampleStaffList = getSampleStaffList(count);
  const sampleUsers = sampleStaffList.map((staff) => ({
    staffId: staff.staffIdNo,
    email: internet.email(staff.firstName),
    username: internet.userName(staff.firstName),
  }));
  return { sampleStaffList, sampleUsers };
};

module.exports = { getSampleUsers };
