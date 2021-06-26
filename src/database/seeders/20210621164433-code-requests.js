const dotenv = require('dotenv');
dotenv.config();
const generateSampleRequestForRefcodesForSeed = require('../../shared/samples/refcodeRequest.samples');
const { log } = console;

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: async (queryInterface, Sequelize) => {
    try {
      const codeRequests = await generateSampleRequestForRefcodesForSeed(1000);
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
