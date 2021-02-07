import { v2 as cloudinary } from 'cloudinary';

import getEnrollees from '../../../../src/shared/samples/enrollee.samples';
import TestService from '../../app/app.test.service';
import ROLES from '../../../../src/shared/constants/roles.constants';
import getSampleStaffs from '../../../../src/shared/samples/staff.samples';
import EnrolleeTest from '../enrollee.test.service';

const originalImplementation = cloudinary.uploader.upload;
// const { log } = console;

describe('EnrolleeController', () => {
  describe('updateEnrollee', () => {
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
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.SUPERADMIN
      );
      token = data.token;
    });
    afterAll(() => {
      cloudinary.uploader.upload = originalImplementation;
    });

    it('it successfully updates the enrollee with the new changes', async (done) => {
      try {
        const p1 = principal1;
        const changes = { firstName: 'New FirstName' };
        const res = await EnrolleeTest.update(p1.id, changes, token);
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(data.firstName).toBe(changes.firstName);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it detects unique violation during update', async (done) => {
      try {
        const p1 = principal1;
        const p2 = principal2;
        const changes = { serviceNumber: p2.serviceNumber };
        const res = await EnrolleeTest.update(p1.id, changes, token);
        expect(res.status).toBe(400);
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
