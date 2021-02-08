import getEnrollees from '../../../../src/shared/samples/enrollee.samples';
import TestService from '../../app/app.test.service';
import ROLES from '../../../../src/shared/constants/roles.constants';
import getSampleStaffs from '../../../../src/shared/samples/staff.samples';
import EnrolleeTest from '../enrollee.test.service';

// const { log } = console;

describe('EnrolleeController', () => {
  describe('deleteEnrollee', () => {
    let sampleEnrollees, token, hcp, samplePrncpl1, samplePrncpl2;
    let principal1, principal2;

    beforeAll(async () => {
      await TestService.resetDB();
      const HCPs = await TestService.seedHCPs(1);
      hcp = HCPs[0];

      sampleEnrollees = getEnrollees({
        numOfPrincipals: 2,
        sameSchemeDepPerPrincipal: 1,
        vcshipDepPerPrincipal: 1,
      });
      const principals = TestService.removeNullValues(
        sampleEnrollees.principals
      );
      samplePrncpl1 = {
        ...principals[0],
        scheme: 'AFRSHIP',
        hcpId: hcp.id,
        staffNumber: null,
        serviceNumber: 'NN/0002',
        enrolleeIdNo: '000231',
      };
      samplePrncpl2 = {
        ...principals[1],
        scheme: 'AFRSHIP',
        hcpId: hcp.id,
        staffNumber: null,
        serviceNumber: 'NN/0003',
        enrolleeIdNo: '000232',
      };
      const [p1, p2] = await TestService.seedEnrollees([
        samplePrncpl1,
        samplePrncpl2,
      ]);
      principal1 = p1;
      principal2 = p2;
      await EnrolleeTest.addDependantsToPrincipal(
        sampleEnrollees.dependants.map((depdnt, i) => ({
          ...depdnt,
          enrolleeIdNo: `${p2.enrolleeIdNo}-${i + 1}`,
        })),
        p2
      );
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.SUPERADMIN
      );
      token = data.token;
    });

    it('it returns status 200 and a success message', async (done) => {
      try {
        const res = await EnrolleeTest.deleteEnrollee(principal1.id, token);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it deletes all of a principal"s dependant along with the principal', async (done) => {
      try {
        await EnrolleeTest.deleteEnrollee(principal2.id, token);
        const depedants = await EnrolleeTest.getPrincipalDependants(
          principal2.id
        );
        expect(depedants).toHaveLength(0);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns not found error if the enrolleeId is not founc', async (done) => {
      try {
        const nonExistingId = principal2.id * 5;
        const res = await EnrolleeTest.deleteEnrollee(nonExistingId, token);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
        expect(res.body.errors[0]).toMatch(/no record found for/i);
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
