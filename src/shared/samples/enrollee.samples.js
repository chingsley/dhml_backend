import { moment, days, months } from '../../utils/timers';
import { RANKS } from '../constants/ranks.constants';
import {
  MAX_PRINCIPALS_COUNT,
  MAX_STAFF_COUNT,
} from '../constants/seeders.constants';
import { states } from '../constants/lists.constants';
import { enrolleeUploads } from './uploads.sample';
const { designations } = require('./designations.sample');

const faker = require('faker');
const {
  phone,
  name,
  address,
  date,
  commerce,
  random,
  company,
  internet,
} = faker;
const { zeroPadding, getRandomInt } = require('../../utils/helpers');

const getEnrollees = (options = {}) => {
  const {
    numOfPrincipals = 1,
    sameSchemeDepPerPrincipal = 0,
    vcshipDepPerPrincipal = 0,
  } = options;
  const principals = [];
  const dependants = [];
  for (let i = 0; i < numOfPrincipals; i++) {
    const principal = getPrincipal(i);
    principals.push(principal);
    const totalDeps = sameSchemeDepPerPrincipal + vcshipDepPerPrincipal;
    let n = 0;
    while (n < sameSchemeDepPerPrincipal) {
      dependants.push(
        getSameSchemeDep(n, { principal, principalIntegerId: i + 1 })
      );
      n += 1;
    }
    while (n < totalDeps) {
      dependants.push(
        getVcshipDep(n, { principal, principalIntegerId: i + 1 })
      );
      n += 1;
    }
  }
  return { principals, dependants };
};

export const staffIdNos = Array.from(Array(MAX_STAFF_COUNT).keys())
  .slice(1)
  .map((id) => `STF/${zeroPadding(id, 4)}`);

// console.log('staffIdNos = ', staffIdNos);

function getPrincipal(index) {
  const i = index;
  const isMillitary = i % 2 === 0;
  const isStaff = !isMillitary;
  const armOfService = isMillitary
    ? random.arrayElement(['army', 'navy', 'air force'])
    : null;
  const gender = random.arrayElement(['male', 'female']);
  const title = gender === 'female' ? 'Mrs' : 'Mr';
  const designation = isStaff ? random.arrayElement(designations) : null;
  const isVerified = i < 0.9 * MAX_PRINCIPALS_COUNT;
  const dateVerified = isVerified
    ? faker.date.between(months.setPast(2), days.today)
    : null;
  const employer = isStaff
    ? company.companyName()
    : 'Federal Republic of Nigeria';

  const scheme = isMillitary
    ? 'AFRSHIP'
    : random.arrayElement(['DSSHIP', 'VCSHIP']);

  const j = i + 1;
  return {
    enrolleeIdNo: zeroPadding(j + 230),
    ...getBaseFeatures(),
    hcpId: getRandomInt(100, { min: 1 }),
    scheme,
    surname: name.lastName(),
    rank: isMillitary ? random.arrayElement(RANKS) : null,
    serviceNumber: i % 2 === 0 ? `SN/${zeroPadding(j)}` : null,
    staffNumber: i % 2 !== 0 ? staffIdNos[i] : null,
    title: title,
    designation: designation,
    armOfService: armOfService,
    department: `${commerce.department()} Unit`,
    employer: employer,
    dateOfBirth: moment(date.past(150)).format('YYYY-MM-DD'),
    gender: gender,
    maritalStatus: random.arrayElement(['single', 'married']),
    serviceStatus: isMillitary
      ? random.arrayElement(['serving', 'retired'])
      : undefined,
    isVerified,
    dateVerified,
  };
}

function getSameSchemeDep(childIndex, { principal, principalIntegerId }) {
  const variables = getVariableDependantFeatures(principal);
  const { relationshipToPrincipal: rtp } = variables;
  const dateOfBirth = rtp === 'child' ? date.past(30) : date.past(5);
  return {
    enrolleeIdNo: `${principal.enrolleeIdNo}-${childIndex + 1}`,
    ...getBaseFeatures(),
    ...getVariableDependantFeatures(principal),
    surname: principal.surname,
    dependantClass: 'same-scheme-dependant',
    relationshipToPrincipal: rtp,
    principalId: principalIntegerId,
    scheme: principal.scheme,
    dateOfBirth: moment(dateOfBirth).format('YYYY-MM-DD'),
    dependantType: `${principal.scheme}-TO-${principal.scheme}`,
    isVerified: principal.isVerified,
    dateVerified: principal.dateVerified,
  };
}

function getVcshipDep(childIndex, { principal, principalIntegerId }) {
  return {
    enrolleeIdNo: `${principal.enrolleeIdNo}-${childIndex + 1}`,
    ...getBaseFeatures(),
    ...getVariableDependantFeatures(principal),
    surname: principal.surname,
    dependantClass: 'other-scheme-dependant',
    dateOfBirth: moment(date.past(20)).format('YYYY-MM-DD'),
    principalId: principalIntegerId,
    scheme: 'VCSHIP',
    dependantType: `${principal.scheme}-TO-VCSHIP`,
    isVerified: principal.isVerified,
    dateVerified: principal.dateVerified,
  };
}

function getBaseFeatures() {
  return {
    firstName: name.firstName(),
    middleName: name.firstName(),
    email: internet.email(),
    identificationType: random.arrayElement([
      'National ID',
      'Int. Passport',
      'Drivers Licence',
    ]),
    identificationNumber: zeroPadding(getRandomInt(18988769902), 9),
    phoneNumber: phone.phoneNumber(),
    stateOfResidence: random.arrayElement(states),
    residentialAddress: address.secondaryAddress(),
    lga: address.county(),
    bloodGroup: random.arrayElement(['A+', 'B+', 'O+', 'AB+']),
    significantMedicalHistory: '[diabetes, allergies]',
    ...enrolleeUploads,
  };
}

function getVariableDependantFeatures(principal) {
  const rtp =
    principal.maritalStatus === 'married'
      ? random.arrayElement(['child', 'spouse'])
      : 'child';
  let gender;
  if (rtp === 'spouse') {
    gender = principal.gender === 'male' ? 'female' : 'male';
  } else {
    gender = random.arrayElement(['male', 'female']);
  }
  const hcpId = random.arrayElement([
    getRandomInt(100, { min: 1 }),
    principal.hcpId,
  ]);
  return {
    relationshipToPrincipal: rtp,
    gender,
    hcpId,
    armOfService: principal.armOfService,
  };
}

module.exports = getEnrollees;
