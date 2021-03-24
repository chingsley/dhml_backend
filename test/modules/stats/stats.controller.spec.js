/* eslint-disable jest/expect-expect */
import getEnrollees from '../../../src/shared/samples/enrollee.samples';
import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import StatsController from '../../../src/modules/stats/stats.controller';
import EnrolleeTest from '../enrollee/enrollee.test.service';
import StatsApi from './stats.test.api';

const { MD, HOD_AUDIT, HOD_ACCOUNT } = ROLES;

describe('StatsController', () => {
  describe('getGeneralStats', () => {
    let sampleEnrollees, HCPs, seededPrincipals, seededDependants, res, token;
    beforeAll(async () => {
      await TestService.resetDB();
      HCPs = await TestService.seedHCPs(4);
      sampleEnrollees = getEnrollees({
        numOfPrincipals: 40,
        sameSchemeDepPerPrincipal: 2,
      });
      const seededEnrollees = await EnrolleeTest.seedAfrship(
        sampleEnrollees,
        HCPs
      );
      seededPrincipals = seededEnrollees.principals;
      seededDependants = seededEnrollees.dependants;
      token = await TestService.getTokenMultiple(
        [MD, HOD_AUDIT, HOD_ACCOUNT],
        getSampleStaffs(3).sampleStaffs
      );
      res = await StatsApi.getGeneralStats(token[MD]);
    });

    it('returns status 200 on successful GET', async (done) => {
      try {
        const { data } = res.body;
        expect(res.status).toBe(200);
        const expectedKeys = [
          'activeHcps',
          'hcpsByArmOfService',
          'enrolleesByArmOfService',
          'activeHcpsByState',
          'activeHcpsByGeopoliticalZone',
        ];
        for (let key of expectedKeys) {
          expect(data).toHaveProperty(key);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns the total no. of enrollees in enrolleesByArmOfService', async (done) => {
      try {
        const { data } = res.body;
        const totalEnrollees = data.enrolleesByArmOfService.reduce(
          (acc, stat) => {
            acc += Number(stat.count);
            return acc;
          },
          0
        );
        const afrshipEnrollees = [
          ...seededDependants,
          ...seededPrincipals,
        ].filter((e) => e.scheme && e.scheme.match(/afrship/i));
        expect(afrshipEnrollees).toHaveLength(totalEnrollees);
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(StatsController.getGeneralStats)
    );
  });
});
