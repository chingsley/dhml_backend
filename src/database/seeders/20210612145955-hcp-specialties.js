/* eslint-disable no-unused-vars */

const { getRandomIntArr } = require('../../utils/helpers');
const db = require('../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hcps = await db.HealthCareProvider.findAll({ attributes: ['id'] });
    const specialties = await db.Specialty.findAll({ attributes: ['id'] });

    const promiseArr = hcps.map((hcp) => {
      const specialtyIndices = getRandomIntArr(0, specialties.length - 1, 3);
      const hcpSpecialties = specialtyIndices.map((index) => ({
        hcpId: hcp.id,
        specialtyId: specialties[index].id,
      }));

      return queryInterface.bulkInsert('HcpSpecialties', hcpSpecialties);
    });

    await Promise.all(promiseArr);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('HcpSpecialties', null, {});
  },
};
