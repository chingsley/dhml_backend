const { Op } = require('sequelize');
const db = require('../models');
const Claims = require('../../shared/samples/claims.sample');
const SKIP_FFS_SEED = process.env.SKIP_FFS_SEED;
module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: async (queryInterface, Sequelize) => {
    if (SKIP_FFS_SEED === 'true') {
      return new Promise((resolve, _) => {
        resolve();
      });
    } else {
      const approvedRefcodes = await db.ReferalCode.findAll({
        where: { dateApproved: { [Op.not]: null } },
        include: { model: db.HealthCareProvider, as: 'receivingHcp' },
      });
      const claim = new Claims(approvedRefcodes);
      const sampleClaims = claim.getBulk({
        numDrugClaims: Math.floor(approvedRefcodes.length / 2),
        numServiceClaims: Math.floor(approvedRefcodes.length / 2),
      });
      await queryInterface.bulkInsert('OriginalClaims', sampleClaims);
      await queryInterface.bulkInsert(
        'Claims',
        sampleClaims.map((c) => ({ ...c, originalClaimId: c.id }))
      );
    }
  },

  // eslint-disable-next-line no-unused-vars
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Claims', null, {});
    return queryInterface.bulkDelete('OriginalClaims', null, {});
  },
};
