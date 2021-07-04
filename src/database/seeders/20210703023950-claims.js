const { Op } = require('sequelize');
const db = require('../models');
const Claims = require('../../shared/samples/claims.sample');

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: async (queryInterface, Sequelize) => {
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
    // console.log({ sampleClaims, refcodeIds, approvedCodeRequests });
    await queryInterface.bulkInsert('Claims', sampleClaims);
  },

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Claims', null, {});
  },
};
