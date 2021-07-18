const { Op } = require('sequelize');
const db = require('../models');
const Claims = require('../../shared/samples/claims.sample');
const IS_DEV = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: async (queryInterface, Sequelize) => {
    if (IS_DEV) {
      const approvedRefcodes = await db.ReferalCode.findAll({
        where: { dateApproved: { [Op.not]: null } },
        include: { model: db.HealthCareProvider, as: 'receivingHcp' },
      });
      // const refcodeIds = approvedCodeRequests.map((refcode) => refcode.id);
      const claim = new Claims(approvedRefcodes);
      const sampleClaims = claim.getBulk({
        numDrugClaims: Math.floor(approvedRefcodes.length / 2),
        numServiceClaims: Math.floor(approvedRefcodes.length / 2),
      });
      await queryInterface.bulkInsert('Claims', sampleClaims);
    } else {
      // await queryInterface.bulkInsert('Claims', []);
      return new Promise((resolve, _) => {
        resolve();
      });
    }
    // console.log({ sampleClaims, refcodeIds, approvedCodeRequests });
  },

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Claims', null, {});
  },
};
