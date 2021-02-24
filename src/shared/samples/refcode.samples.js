const faker = require('faker');
const {
  specialistCodes,
  stateCodes,
} = require('../constants/statecodes.constants');

function getSampleReferalCodes(count = 1) {
  const refcodes = Array.from(Array(count).keys()).map((_, i) => ({
    enrolleeId: i + 1,
    destinationHcpId: i + 1,
    reasonForReferral: faker.lorem.text(),
    diagnosis: faker.lorem.words(),
    diagnosisStatus: faker.random.arrayElement(['provisional', 'final']),
    clinicalFindings: faker.lorem.text(),
    specialist: faker.random.arrayElement(Object.keys(specialistCodes)),
    stateOfGeneration: faker.random.arrayElement(Object.keys(stateCodes)),
  }));

  return refcodes;
}

module.exports = getSampleReferalCodes;
