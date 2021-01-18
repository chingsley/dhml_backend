import { MAX_PRINCIPALS_COUNT } from '../constants/seeders.constants';
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

export const getEnrollees = (countPrincipals = MAX_PRINCIPALS_COUNT) => {
  const principals = [];
  const dependants = [];
  for (let i = 0; i < countPrincipals; i++) {
    const j = i + 1;
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
    const aPrincipal = {
      id: zeroPadding(j + 230),
      hcpId: getRandomInt(1000),
      scheme: random.arrayElement(['DSSHIP', 'VCSHIP', 'AFRSHIP']),
      surname: name.lastName(),
      firstName: name.firstName(),
      middleName: name.firstName(),
      rank: random.arrayElement(ranks),
      serviceNumber: i % 2 === 0 ? `SN/${zeroPadding(j)}` : null,
      staffNumber: i % 2 !== 0 ? `SN/${zeroPadding(j)}` : null,
      title: title,
      designation: designation,
      armOfService: armOfService,
      department: `${commerce.department()} Unit`,
      employer: employer,
      dateOfBirth: date.past(150),
      gender: gender,
      maritalStatus: random.arrayElement(['single', 'married']),
      identificationType: random.arrayElement([
        'National ID',
        'Int. Passport',
        'Drivers Licence',
      ]),
      identificationNumber: zeroPadding(getRandomInt(18988769902), 9),
      serviceStatus: random.arrayElement(['serving', 'retired']),
      phoneNumber: phone.phoneNumber(),
      email: internet.email(),
      residentialAddress: address.secondaryAddress(),
      stateOfResidence: address.state(),
      lga: address.county(),
      bloodGroup: random.arrayElement(['A+', 'B+', 'O+', 'AB+']),
      significantMedicalHistory: '[diabetes, allergies]',
      ...enrolleeUploads,
    };
    principals.push(aPrincipal);

    for (let i = 0; i < 5; i++) {
      let rtp;
      let scheme = aPrincipal.scheme;
      let gender = random.arrayElement(['male', 'female']);
      if (i < 2) {
        rtp = 'child';
      } else if (i === 3) {
        rtp = 'spouse';
        gender = aPrincipal.gender === 'female' ? 'male' : 'female';
      } else {
        rtp = random.arrayElement(['father', 'mother']);
        gender = rtp === 'father' ? 'male' : 'female';
        scheme = 'VCSHIP';
      }
      const dateOfBirth = rtp !== 'child' ? date.past(5) : date.past(30);

      const dependantClass =
        scheme === aPrincipal.scheme
          ? 'same-scheme-dependant'
          : 'vcship-scheme-dependant';

      dependants.push({
        id: `${aPrincipal.id}-${i + 1}`,
        principalId: aPrincipal.id,
        hcpId: aPrincipal.hcpId,
        scheme: scheme,
        surname: name.lastName(),
        firstName: name.firstName(),
        middleName: name.firstName(),
        gender: gender,
        relationshipToPrincipal: rtp,
        dateOfBirth: dateOfBirth,
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
        dependantClass: dependantClass,
        dependantType: `${aPrincipal.scheme}-TO-${scheme}`,
        photograph: aPrincipal.photograph,
        birthCertificate: aPrincipal.birthCertificate,
        marriageCertificate: aPrincipal.marriageCertificate,
        idCard: aPrincipal.idCard,
        deathCertificate: aPrincipal.deathCertificate,
        letterOfNok: aPrincipal.letterOfNok,
        ...enrolleeUploads,
      });
    }
  }
  return { principals, dependants };
};

module.exports = { getEnrollees };
