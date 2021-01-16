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
} = faker;
const { zeroPadding, getRandomInt } = require('../../utils/helpers');
const { designations } = require('./designations.sample');

function getSampleStaffList(count) {
  const sampleStaffList = [];
  const relations = ['brother', 'sister', 'father', 'mother', 'aunt', 'uncle'];
  const getAddress = () =>
    `${address.zipCode()} ${address.city()},  ${address.state()}, ${address.country()}`;
  const getName = () => `${name.lastName()} ${name.firstName()}`;
  for (let i = 0; i < count; i++) {
    const maritalStatus = ['married', 'single'][getRandomInt(1)];
    const children = {
      single: 0,
      married: [1, 2, 3, 4, 5][getRandomInt(4)],
    };
    sampleStaffList.push({
      staffFileNo: zeroPadding(i + 1, 4),
      staffIdNo: `STF/${zeroPadding(i + 1, 4)}`,
      surname: name.lastName(),
      firstName: name.firstName(),
      middleName: name.firstName(),
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
      gradeLevelOnFirstAppointment: getRandomInt(5),
      presentAppointment: name.jobTitle(),
      dateOfPresentAppointment: date.past(),
      presentGradeLevel: getRandomInt(15),
      designation: designations[getRandomInt(designations.length)],
      departmentOrUnit: `${commerce.department()} Unit`,
      deployment: address.state(),
      location: address.state(),
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
      qualifications: ['HND', 'Bachelors', 'Masters', 'Ph.D'][getRandomInt(3)],
      nameOfPreviousEmployer: company.companyName(),
      positionHeld: name.jobDescriptor(),
      jobScheduleAtPreviousEmployment: ['morning', 'night'][getRandomInt(1)],
      reasonForDisengagement: lorem.words(),
      dateOfDisengagement: date.past(),
      hodRemarks: 'Complete details, approved',
      mdComment: 'Complete details, approved',
      nextOfKin: getName(),
      relationshipWithNok: relations[getRandomInt(relations.length)],
      addressOfNok: getAddress(),
      phoneNumberOfNok: phone.phoneNumber(),
    });
  }

  return sampleStaffList;
}

module.exports = getSampleStaffList;
