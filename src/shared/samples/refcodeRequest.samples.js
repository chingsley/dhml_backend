const faker = require('faker');
const { getRandomInt } = require('../../utils/helpers');
const db = require('../../database/models');

async function generateSampleRequestForRefcodesForSeed(numOfEnrollees = 1000) {
  const seededEnrollees = await db.Enrollee.findAll({
    where: {},
    include: {
      model: db.HealthCareProvider,
      as: 'hcp',
      attributes: ['id'],
      required: true,
    },
    limit: numOfEnrollees,
  });
  const hcpSpecialties = await db.HcpSpecialty.findAll();
  return seededEnrollees.map((enrollee) => {
    const randomNum = getRandomInt(hcpSpecialties.length - 1, { min: 0 });
    return {
      enrolleeId: enrollee.id,
      referringHcpId: enrollee.hcp.id,
      receivingHcpId: hcpSpecialties[randomNum].hcpId,
      specialtyId: hcpSpecialties[randomNum].specialtyId,
      reasonForReferral: faker.lorem.text(),
      diagnosis: faker.lorem.words(),
      clinicalFindings: faker.lorem.text(),
    };
  });
}

module.exports = generateSampleRequestForRefcodesForSeed;
