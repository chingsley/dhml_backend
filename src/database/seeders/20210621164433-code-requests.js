const dotenv = require('dotenv');
dotenv.config();
const RefcodeSample = require('../../shared/samples/refcodeRequest.samples');
const db = require('../../database/models');
const { loggNodeEnvWarning } = require('../helpers');
const SKIP_FFS_SEED = process.env.SKIP_FFS_SEED;

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: async (queryInterface, Sequelize) => {
    try {
      if (SKIP_FFS_SEED === 'true') {
        return new Promise((resolve, _) => {
          resolve();
        });
      } else {
        const hcpSpecialties = await db.HcpSpecialty.findAll();
        const specialties = await db.Specialty.findAll();
        const enrollees = await db.Enrollee.findAll();
        const users = await db.User.findAll({
          include: { model: db.Staff, as: 'staffInfo' },
        });
        const refcodeSample = new RefcodeSample({
          enrollees,
          specialties,
          hcpSpecialties,
          users,
        });
        const numPending = Math.floor(enrollees.length / 4);
        const numApproved = Math.floor(enrollees.length / 4);
        const numVerified = Math.floor(enrollees.length / 2);
        const codeRequests = refcodeSample.getBulkSamples({
          numPending,
          numApproved,
          numVerified,
        });
        // const codeRequests = await generateSampleRequestForRefcodesForSeed(1000);
        await queryInterface.bulkInsert('ReferalCodes', codeRequests);
      }
    } catch (error) {
      loggNodeEnvWarning(error.message);
    }
  },

  // eslint-disable-next-line no-unused-vars
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('ReferalCodes', null, {});
  },
};
