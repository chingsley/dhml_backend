import getEnrollees from '../../../../src/shared/samples/enrollee.samples';
import TestService from '../../app/app.test.service';
import ROLES from '../../../../src/shared/constants/roles.constants';
import getSampleStaffs from '../../../../src/shared/samples/staff.samples';
import EnrolleeTest from '../enrollee.test.service';

// const { log } = console;

describe('EnrolleeController', () => {
  describe('unverifyEnrollee', () => {
    let sampleEnrollees, token, hcp, samplePrincipal;
    let principal, res, unverifiedPrincipal;

    beforeAll(async () => {
      await TestService.resetDB();
      const HCPs = await TestService.seedHCPs(1);
      hcp = HCPs[0];

      sampleEnrollees = getEnrollees({
        numOfPrincipals: 1,
        sameSchemeDepPerPrincipal: 1,
        vcshipDepPerPrincipal: 1,
      });
      const principals = TestService.removeNullValues(
        sampleEnrollees.principals
      );
      samplePrincipal = {
        ...principals[0],
        scheme: 'AFRSHIP',
        hcpId: hcp.id,
        staffNumber: null,
        serviceNumber: 'NN/0002',
        enrolleeIdNo: '000231',
        isVerified: true,
      };
      const [seededPrincipal] = await TestService.seedEnrollees([
        samplePrincipal,
      ]);
      principal = seededPrincipal;
      await EnrolleeTest.addDependantsToPrincipal(
        sampleEnrollees.dependants.map((d) => ({ ...d, isVerified: true })),
        principal
      );
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.SUPERADMIN
      );
      token = data.token;
      res = await EnrolleeTest.unverifyPrincipal(principal.id, token);
      unverifiedPrincipal = await EnrolleeTest.findById(principal.id);
    });

    it('it returns status 200 and a success message', async (done) => {
      try {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it sets the enrollee"s isVerified status to false and dateVerified to null', async (done) => {
      try {
        expect(unverifiedPrincipal.isVerified).toBe(false);
        expect(unverifiedPrincipal.dateVerified).toBe(null);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it also unverifies all dependants under the principal', async (done) => {
      try {
        for (let {
          isVerified,
          dateVerified,
        } of unverifiedPrincipal.dependants) {
          expect(isVerified).toBe(false);
          expect(dateVerified).toBe(null);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
