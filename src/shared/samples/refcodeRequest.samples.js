import { v4 as uuidv4 } from 'uuid';
const faker = require('faker');
const { getRandomInt, _random } = require('../../utils/helpers');
const db = require('../../database/models');
const { states } = require('../constants/lists.constants');

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
      id: uuidv4(),
      enrolleeId: enrollee.id,
      referringHcpId: enrollee.hcp.id,
      receivingHcpId: hcpSpecialties[randomNum].hcpId,
      specialtyId: hcpSpecialties[randomNum].specialtyId,
      reasonForReferral: faker.lorem.text(),
      diagnosis: faker.lorem.words(),
      clinicalFindings: faker.lorem.text(),
      requestState: _random(states),
    };
  });
}

module.exports = generateSampleRequestForRefcodesForSeed;
