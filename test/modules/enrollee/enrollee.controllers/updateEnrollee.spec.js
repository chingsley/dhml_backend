/* eslint-disable jest/expect-expect */

import getEnrollees from '../../../../src/shared/samples/enrollee.samples';
import TestService from '../../app/app.test.service';
import ROLES from '../../../../src/shared/constants/roles.constants';
import getSampleStaffs from '../../../../src/shared/samples/staff.samples';
import EnrolleeApi from '../enrollee.test.api';
import EnrolleeController from '../../../../src/modules/enrollee/enrollee.controller';

// const { log } = console;

describe('EnrolleeController', () => {
  describe('getEnrolleeById', () => {
    let sampleEnrollees, token, HCPs, seededPrincipals, seededDependants, res;
    beforeAll(async () => {
      await TestService.resetDB();
      HCPs = await TestService.seedHCPs(4);
      const { sampleStaffs } = getSampleStaffs(1);
      sampleEnrollees = getEnrollees({
        numOfPrincipals: 1,
        sameSchemeDepPerPrincipal: 1,
        vcshipDepPerPrincipal: 1,
      });
      const principals = sampleEnrollees.principals;
      seededPrincipals = await TestService.seedEnrollees([
        {
          ...principals[0],
          scheme: 'AFRSHIP',
          enrolmentType: 'principal',
          hcpId: HCPs[0].id,
          isVerified: true,
        },
      ]);

      const deps = sampleEnrollees.dependants.map((d) => {
        for (let p of seededPrincipals) {
          const regexPrincipalEnrolleeIdNo = new RegExp(`${p.enrolleeIdNo}-`);
          if (d.enrolleeIdNo.match(regexPrincipalEnrolleeIdNo)) {
            return {
              ...d,
              principalId: p.id,
              hcpId: p.hcpId,
            };
          }
        }
      });
      seededDependants = await TestService.seedEnrollees(deps);

      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.ENROLMENT_OFFICER
      );
      token = data.token;
      res = await EnrolleeApi.getById(seededPrincipals[0].id, token);
    });

    it('returns status 200 on successful GET request', async (done) => {
      try {
        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('data');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can get a dependant enrollee by id', async (done) => {
      try {
        const res = await EnrolleeApi.getById(seededDependants[0].id, token);
        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('data');
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(EnrolleeController.getByEnrolleeId)
    );
  });
});
