const dotenv = require('dotenv');
const faker = require('faker');
const { months, days, moment } = require('../../utils/timers');
dotenv.config();
const db = require('../models');
const { randInt } = require('../../utils/helpers');
const generateSampleRequestForRefcodesForSeed = require('../../shared/samples/refcodeRequest.samples');
const armOfService = ['NAVY', 'ARMY', 'AIR FORCE', 'TRI-SERVICE'];
const serviceStatus = ['retired', 'serving', undefined];
const { log } = console;

const createdAt = (enrollee) => ({
  createdAt: moment(enrollee.dateVerified ?? new Date())
    .subtract(randInt(1, 30), 'days')
    .format('YYYY-MM-DD'),
});

if (process.env.SEED_WITH === 'LIVE_DATA') {
  const enrollees = require('../../../live_data/Enrollees.json');
  const { principals, dependants } = enrollees.reduce(
    (acc, enrollee) => {
      const n = randInt(1, 2);
      if (enrollee.principalId === null) {
        acc.principals.push({
          ...enrollee,
          isVerified: n === 1 ? true : false,
          dateVerified:
            n === 1
              ? faker.date.between(months.setPast(4), days.today)
              : undefined,
          armOfService: enrollee.scheme.match(/afrship/i)
            ? armOfService[randInt(0, armOfService.length - 1)]
            : undefined,
          serviceStatus: enrollee.scheme.match(/afrship/i)
            ? serviceStatus[randInt(0, serviceStatus.length - 1)]
            : undefined,
          ...createdAt(enrollee),
        });
      } else {
        acc.dependants.push(enrollee);
      }
      return acc;
    },
    { principals: [], dependants: [] }
  );

  module.exports = {
    // eslint-disable-next-line no-unused-vars
    up: async (queryInterface, Sequelize) => {
      await queryInterface.bulkInsert('Enrollees', principals);
      const seededPrincipals = await db.Enrollee.findAll({
        where: { principalId: null },
      });
      const dictPrincipalId = seededPrincipals.reduce((acc, p) => {
        acc[p.enrolleeIdNo] = p;
        return acc;
      }, {});
      const dependantsWithPrincipalId = dependants.map((d) => {
        const principalEnrolleeIdNo = d.enrolleeIdNo.split('-')[0];
        if (!dictPrincipalId[principalEnrolleeIdNo]) {
          log(principalEnrolleeIdNo, d);
        }
        return {
          ...d,
          principalId: dictPrincipalId[principalEnrolleeIdNo].id,
          isVerified: dictPrincipalId[principalEnrolleeIdNo].isVerified,
          dateVerified: dictPrincipalId[principalEnrolleeIdNo].dateVerified,
          ...createdAt(dictPrincipalId[principalEnrolleeIdNo]),
        };
      });
      await queryInterface.bulkInsert('Enrollees', dependantsWithPrincipalId);
      const codeRequests = await generateSampleRequestForRefcodesForSeed(1000);
      await queryInterface.bulkInsert('ReferalCodes', codeRequests);
    },

    // eslint-disable-next-line no-unused-vars
    down: async (queryInterface, Sequelize) => {
      // await queryInterface.bulkDelete('ReferalCodes', null, {});
      await queryInterface.bulkDelete('Enrollees', null, {});
    },
  };
} else {
  const {
    MAX_PRINCIPALS_COUNT,
  } = require('../../shared/constants/seeders.constants');
  const getEnrollees = require('../../shared/samples/enrollee.samples');

  const { principals, dependants } = getEnrollees({
    numOfPrincipals: MAX_PRINCIPALS_COUNT,
    sameSchemeDepPerPrincipal: 2,
    vcshipDepPerPrincipal: 1,
  });

  module.exports = {
    // eslint-disable-next-line no-unused-vars
    up: async (queryInterface, Sequelize) => {
      try {
        await queryInterface.bulkInsert(
          'Enrollees',
          principals.map((p) => ({ ...p, ...createdAt(p) }))
        );
        await queryInterface.bulkInsert(
          'Enrollees',
          dependants.map((d) => ({ ...d, ...createdAt(d) }))
        );
        const codeRequests = await generateSampleRequestForRefcodesForSeed(
          1000
        );
        await queryInterface.bulkInsert('ReferalCodes', codeRequests);
      } catch (e) {
        log(e.message);
      }
    },

    // eslint-disable-next-line no-unused-vars
    down: async (queryInterface, Sequelize) => {
      // await queryInterface.bulkDelete('ReferalCodes', null, {});
      await queryInterface.bulkDelete('Enrollees', null, {});
    },
  };
}
