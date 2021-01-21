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

const ranks = [
  'Lt',
  'SLt',
  'Capt',
  'Lt Cdr',
  'Cdr',
  'Cdre',
  'Adm',
  'R/Adm',
  'V/Adm',
  'OS',
  'SM',
  'AB',
  'SM',
  'AB',
  'LS',
  'PO',
  'WO',
  'MWO',
  'NWO',
];

export const getEnrollees = (options = {}) => {
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
      dependants.push(getSameSchemeDep(n, { principal }));
      n += 1;
    }
    while (n < totalDeps) {
      dependants.push(getVcshipDep(n, { principal }));
      n += 1;
    }
  }
  return { principals, dependants };
};

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
  const employer = isStaff
    ? company.companyName()
    : 'Federal Republic of Nigeria';

  const j = i + 1;
  return {
    id: zeroPadding(j + 230),
    ...getBaseFeatures(),
    hcpId: getRandomInt(1000, { min: 1 }),
    scheme: random.arrayElement(['DSSHIP', 'VCSHIP', 'AFRSHIP']),
    surname: name.lastName(),
    rank: isMillitary ? random.arrayElement(ranks) : null,
    serviceNumber: i % 2 === 0 ? `SN/${zeroPadding(j)}` : null,
    staffNumber: i % 2 !== 0 ? `STF/${zeroPadding(j)}` : null,
    title: title,
    designation: designation,
    armOfService: armOfService,
    department: `${commerce.department()} Unit`,
    employer: employer,
    dateOfBirth: date.past(150),
    gender: gender,
    maritalStatus: random.arrayElement(['single', 'married']),
    serviceStatus: random.arrayElement(['serving', 'retired']),
    residentialAddress: address.secondaryAddress(),
  };
}

function getSameSchemeDep(childIndex, { principal }) {
  const variables = getVariableDependantFetutres(principal);
  const { relationshipToPrincipal: rtp } = variables;
  const dateOfBirth = rtp === 'child' ? date.past(30) : date.past(5);
  return {
    id: `${principal.id}-${childIndex + 1}`,
    ...getBaseFeatures(),
    ...getVariableDependantFetutres(principal),
    surname: principal.surname,
    dependantClass: 'same-scheme-dependant',
    relationshipToPrincipal: rtp,
    principalId: principal.id,
    scheme: principal.scheme,
    dateOfBirth,
    dependantType: `${principal.scheme}-TO-${principal.scheme}`,
  };
}

function getVcshipDep(childIndex, { principal }) {
  return {
    id: `${principal.id}-${childIndex + 1}`,
    ...getBaseFeatures(),
    ...getVariableDependantFetutres(principal),
    surname: principal.surname,
    dependantClass: 'other-scheme-dependant',
    dateOfBirth: date.past(20),
    principalId: principal.id,
    scheme: 'VCSHIP',
    dependantType: `${principal.scheme}-TO-VCSHIP`,
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
    stateOfResidence: address.state(),
    lga: address.county(),
    bloodGroup: random.arrayElement(['A+', 'B+', 'O+', 'AB+']),
    significantMedicalHistory: '[diabetes, allergies]',
    ...enrolleeUploads,
  };
}

function getVariableDependantFetutres(principal) {
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
    getRandomInt(1000, { min: 1 }),
    principal.hcpId,
  ]);
  return { relationshipToPrincipal: rtp, gender, hcpId };
}

module.exports = getEnrollees;
