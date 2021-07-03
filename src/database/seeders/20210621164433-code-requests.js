const dotenv = require('dotenv');
dotenv.config();
const RefcodeSample = require('../../shared/samples/refcodeRequest.samples');
const db = require('../../database/models');
const { log } = console;

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: async (queryInterface, Sequelize) => {
    try {
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

      const codeRequests = refcodeSample.getBulkSamples({
        pending: 500,
        approved: 500,
      });
      // const codeRequests = await generateSampleRequestForRefcodesForSeed(1000);
      await queryInterface.bulkInsert('ReferalCodes', codeRequests);
    } catch (e) {
      log(e.message);
    }
  },

  // eslint-disable-next-line no-unused-vars
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('ReferalCodes', null, {});
  },
};
