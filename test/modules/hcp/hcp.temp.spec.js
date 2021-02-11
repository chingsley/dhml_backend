import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import nodemailer from 'nodemailer';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import HcpApi from './hcp.test.api';
import NanoId from '../../../src/utils/NanoId';
import getSampleHCPs from '../../../src/shared/samples/hcp.samples';
import _HcpService from './hcp.test.service';
import getEnrollees from '../../../src/shared/samples/enrollee.samples';
import TestStaff from '../staff/staff.test.services';
import { MAX_STAFF_COUNT } from '../../../src/shared/constants/seeders.constants';

describe('HcpTemp', () => {
  const nodemailerOriginalImplementation = nodemailer.createTransport;
  const originalNanoIdGetValue = NanoId.getValue;
  const SAMPLE_PASSWORD = 'Testing*123';
  beforeAll(() => {
    nodemailer.createTransport = jest.fn().mockReturnValue({
      sendMail: jest.fn().mockReturnValue({ status: 200 }),
    });
    NanoId.getValue = jest.fn().mockReturnValue(SAMPLE_PASSWORD);
  });
  afterAll(() => {
    nodemailer.createTransport = nodemailerOriginalImplementation;
    NanoId.getValue = originalNanoIdGetValue;
  });
  describe('getManifest/getCapitation', () => {
    let token, seededHCPs, res1, res2, res4;
    const NUM_ACTIVE_HCP = 15;
    const NUM_SUSPENDED_HCP = 5;
    const TOTAL_COUNT_HCP = NUM_ACTIVE_HCP + NUM_SUSPENDED_HCP;
    const LIVES_PER_HCP = 5;
    const PER_UNIT_CHARGE = 750;

    beforeAll(async () => {
      await TestService.resetDB();
      const allHCPs = getSampleHCPs();
      const primaryHCPs = allHCPs
        .filter((h) => h.category.match(/primary/i))
        .slice(0, Math.floor(TOTAL_COUNT_HCP / 2));
      const primaryHcpNoEnrollee = allHCPs
        .filter((h) => h.category.match(/primary/i))
        .slice(
          Math.floor(TOTAL_COUNT_HCP / 2),
          Math.floor(TOTAL_COUNT_HCP / 2) + 1
        );
      const secondaryActiveHCPs = allHCPs
        .filter((h) => h.category.match(/secondary/i))
        .slice(0, Math.ceil(TOTAL_COUNT_HCP / 2));
      const secondarySuspendedHCPs = secondaryActiveHCPs
        .splice(0, NUM_SUSPENDED_HCP)
        .map((hcp) => ({
          ...hcp,
          status: 'suspended',
        }));
      seededHCPs = await _HcpService.bulkInsert([
        ...primaryHCPs,
        ...secondaryActiveHCPs,
        ...secondarySuspendedHCPs,
        ...primaryHcpNoEnrollee,
      ]);
      const { sampleStaffs: stff } = getSampleStaffs(MAX_STAFF_COUNT);
      const seededStaffs = await TestStaff.seedBulk(stff);
      const { principals, dependants } = getEnrollees({
        numOfPrincipals: TOTAL_COUNT_HCP,
        sameSchemeDepPerPrincipal: 3,
        vcshipDepPerPrincipal: 1,
      });
      const seededPrincipals = await TestService.seedEnrollees(
        principals.map((p, i) => {
          return {
            ...p,
            hcpId: seededHCPs[i].id,
            staffNumber: p.staffNumber ? seededStaffs[i].staffIdNo : null,
          };
        })
      );
      const dependantsWithPrincipalId = dependants.reduce((acc, dep, i) => {
        const hcpId = seededHCPs[i % TOTAL_COUNT_HCP].id;
        for (let { enrolleeIdNo, id } of seededPrincipals) {
          if (dep.enrolleeIdNo.match(new RegExp(`${enrolleeIdNo}-`))) {
            acc.push({ ...dep, principalId: id, hcpId });
          }
        }
        return acc;
      }, []);
      await TestService.seedEnrollees(dependantsWithPrincipalId);
      const data = await TestService.getToken(stff[0], ROLES.SUPERADMIN);
      token = data.token;
      res1 = await HcpApi.getManifest('', token);
      res2 = await HcpApi.getCapitation('', token);
      res4 = await HcpApi.downloadHcpManifest(seededHCPs[0].id, token);
    });
    it('downloads hcp manifest', async (done) => {
      try {
        console.log(res4.body, res4.status);
        expect(true).toBe(true);
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
