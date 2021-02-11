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
import { dateOnly, months } from '../../../src/utils/timers';

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
    let token, seededHCPs, res1, res2;
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
    });
    it('returns status 200 and the total record in the db', async (done) => {
      try {
        expect(res1.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns manifest for all active hcp in the system', async (done) => {
      try {
        const { data } = res1.body;
        const totalActiveHcp = await _HcpService.countActive();
        expect(data.count).toEqual(totalActiveHcp);
        expect(data.rows).toHaveLength(totalActiveHcp);
        expect(true).toBe(true);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns the sum of lives in the manifest', async (done) => {
      try {
        const {
          data: {
            total: { lives, principals, dependants },
          },
        } = res1.body;
        expect(lives).toEqual(LIVES_PER_HCP * NUM_ACTIVE_HCP);
        expect(principals + dependants).toEqual(LIVES_PER_HCP * NUM_ACTIVE_HCP);
        done();
      } catch (e) {
        done(e);
      }
    });

    it('computes the capitation for all active HCPs', async (done) => {
      try {
        const {
          data: { total: manifestTotal },
        } = res1.body;
        const {
          data: { total: capitationTotal },
        } = res2.body;
        expect(`${capitationTotal.lives}`).toBe(`${manifestTotal.lives}`);
        done();
      } catch (e) {
        done(e);
      }
    });

    it('computes the total amount to be paid for each hcp', async (done) => {
      try {
        const { data } = res2.body;
        for (let hcp of data.rows) {
          expect(`${Number(hcp.lives) * PER_UNIT_CHARGE}`).toEqual(
            `${hcp.amount}`
          );
        }
        done();
      } catch (e) {
        done(e);
      }
    });

    it('ensures the total amount coputed from manifest matches the total in capitation', async (done) => {
      try {
        const { data: manifestData } = res1.body;
        const totalAmtFromManifest = manifestData.rows.reduce((acc, hcp) => {
          acc +=
            (Number(hcp.principals) + Number(hcp.dependants)) * PER_UNIT_CHARGE;
          return acc;
        }, 0);
        const {
          data: {
            total: { amount: capitationTotalAmnt },
          },
        } = res2.body;
        expect(`${totalAmtFromManifest}`).toBe(`${capitationTotalAmnt}`);
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
