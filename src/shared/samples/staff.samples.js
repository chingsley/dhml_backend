const faker = require('faker');
const {
  phone,
  name,
  address,
  date,
  commerce,
  random,
  company,
  finance,
  lorem,
  internet,
} = faker;
const { zeroPadding, getRandomInt, _random } = require('../../utils/helpers');
const { states } = require('../constants/lists.constants');
const { MAX_STAFF_COUNT } = require('../constants/seeders.constants');
const { designations } = require('./designations.sample');
const genders = ['female', 'male'];
const relations = ['brother', 'sister', 'father', 'mother', 'aunt', 'uncle'];
const qualifications = ['HND', 'Bachelors', 'Masters', 'Ph.D'];
const getName = () => `${name.lastName()} ${name.firstName()}`;
const getAddress = () =>
  `${address.zipCode()} ${address.city()},  ${address.state()}, ${address.country()}`;

function getSampleStaffs(count = MAX_STAFF_COUNT) {
  if (count > MAX_STAFF_COUNT) {
    throw new Error(
      `the maximum staff/users count you can generate is ${MAX_STAFF_COUNT}`
    );
  }

  const sampleStaffs = [];
  for (let i = 0; i < count; i++) {
    const maritalStatus = random.arrayElement(['married', 'single']);
    const children = {
      single: 0,
      married: random.arrayElement([1, 2, 3, 4, 5]),
    };
    const staff = {
      staffFileNo: zeroPadding(i + 1, 4),
      staffIdNo: `STF/${zeroPadding(i + 1, 4)}`,
      surname: name.lastName(),
      firstName: name.firstName(),
      middleName: name.firstName(),
      gender: random.arrayElement(genders),
      permanentHomeAddress: getAddress(),
      contactAddress: getAddress(),
      dateOfBirth: date.past(),
      placeOfBirth: address.state(),
      homeTown: address.state(),
      lga: `${address.county()} LGA`,
      stateOfOrigin: address.state(),
      maritalStatus: maritalStatus,
      numberOfChildren: children[maritalStatus],
      phoneNumber: phone.phoneNumber(),
      firstAppointment: random.words(),
      dateOfFirstAppointment: date.past(),
      gradeLevelOnFirstAppointment: `${getRandomInt(5)}`,
      presentAppointment: name.jobTitle(),
      dateOfPresentAppointment: date.past(),
      presentGradeLevel: `${getRandomInt(15)}`,
      designation: random.arrayElement(designations),
      departmentOrUnit: `${commerce.department()} Unit`,
      deployment: address.state(),
      location: _random(states),
      jobSchedule: name.jobTitle(),
      dateOfConfirmation: date.past(),
      salaryPerAnnum: finance.amount(),
      bank: `${random.word()} bank`,
      branch: `${random.word()} branch`,
      pfa: `${random.word()} Pension Fund`,
      dateOfJoiningDhmlCooperativeSociety: date.past(),
      primarySchoolAttended: `${random.word()} Primary School, ${address.state()} FROM: 1988-08-16, TO: 1994-08-16`,
      secondarySchoolAttended: `${random.word()} Secondary School, ${address.state()} FROM: 1988-08-16, TO: 1994-08-16`,
      tertiaryIntitutionAttended: `${random.word()} University, ${address.state()} FROM: 1988-08-16, TO: 1994-08-16`,
      qualifications: qualifications[getRandomInt(qualifications.length)],
      nameOfPreviousEmployer: company.companyName(),
      positionHeld: name.jobDescriptor(),
      jobScheduleAtPreviousEmployment: random.arrayElement([
        'morning',
        'night',
      ]),
      reasonForDisengagement: lorem.words(),
      dateOfDisengagement: date.past(),
      hodRemarks: 'Complete details, approved',
      mdComment: 'Complete details, approved',
      nextOfKin: getName(),
      relationshipWithNok: random.arrayElement(relations),
      addressOfNok: getAddress(),
      phoneNumberOfNok: phone.phoneNumber(),
      accountNumber: `${getRandomInt(9999999999, { min: 1000000000 })}`,
    };

    staff.email = internet.email(staff.firstName);
    sampleStaffs.push(staff);
  }
  return { sampleStaffs };
}

module.exports = getSampleStaffs;
