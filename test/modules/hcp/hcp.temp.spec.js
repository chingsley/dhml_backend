import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import nodemailer from 'nodemailer';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import HcpApi from './hcp.test.api';
import NanoId from '../../../src/utils/NanoId';
import getSampleHCPs from '../../../src/shared/samples/hcp.samples';
import _HcpService from './hcp.test.service';
import getEnrollees from '../../../src/shared/samples/enrollee.samples';
import _StaffService from '../staff/staff.test.services';
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
  describe('getVerifiedHcpEnrollees', () => {
    let sampleEnrollees, HCPs, seededPrincipals, res, sampleStaffs;
    beforeAll(async () => {
      await TestService.resetDB();
      HCPs = await TestService.seedHCPs(4);
      sampleStaffs = getSampleStaffs(2).sampleStaffs;

      const dsshipStaff = await TestService.seedStaffs([sampleStaffs[1]]);
      sampleEnrollees = getEnrollees({
        numOfPrincipals: 4,
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
        {
          ...principals[1],
          scheme: 'DSSHIP',
          enrolmentType: 'principal',
          hcpId: HCPs[1].id,
          isVerified: true,
          staffNumber: dsshipStaff.staffIdNo,
        },
        {
          ...principals[2],
          scheme: 'VCSHIP',
          enrolmentType: 'principal',
          hcpId: HCPs[2].id,
          isVerified: true,
        },
        {
          ...principals[3],
          scheme: 'AFRSHIP',
          enrolmentType: 'special-principal',
          hcpId: HCPs[3].id,
          isVerified: true,
          staffNumber: undefined,
          rank: 'General',
          armOfService: 'army',
          serviceNumber: principals[3].serviceNumber || 'SN/001/SP',
        },
      ]);

      const deps = sampleEnrollees.dependants.map((d, i) => {
        for (let p of seededPrincipals) {
          const regexPrincipalEnrolleeIdNo = new RegExp(`${p.enrolleeIdNo}-`);
          if (d.enrolleeIdNo.match(regexPrincipalEnrolleeIdNo)) {
            // console.log('d.isVerified = ', d.isVerified);
            return {
              ...d,
              principalId: p.id,
              hcpId: p.hcpId,
              isVerified: i % 2 === 0 ? true : false,
            };
          }
        }
      });
      await TestService.seedEnrollees(deps);
    });

    it('allows a superadmin to get all verififed enrollees for any hcp', async (done) => {
      try {
        const { token } = await TestService.getToken(
          sampleStaffs[0],
          ROLES.ENROLMENT_OFFICER
        );
        for (let hcp of HCPs) {
          res = await HcpApi.getVerifiedHcpEnrollees({ hcpId: hcp.id, token });
          expect(res.status).toEqual(200);
          const { data } = res.body;
          for (let enrollee of data.rows) {
            expect(enrollee.isVerified).toBe(true);
          }
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('ensures hcp users can view thier own verified enrollees', async (done) => {
      try {
        const { token } = await TestService.getHcpToken(HCPs[0]);
        res = await HcpApi.getVerifiedHcpEnrollees({
          hcpId: HCPs[0].id,
          token,
        });
        expect(res.status).toEqual(200);
        const { data } = res.body;
        for (let enrollee of data.rows) {
          expect(enrollee.hcpId).toBe(HCPs[0].id);
          expect(enrollee.isVerified).toBe(true);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('ensures hcp users cannot view enrollees in another hcp', async (done) => {
      try {
        const hcp0 = HCPs[0];
        const hcp1 = HCPs[1];
        const { token } = await TestService.getHcpToken(hcp0);
        res = await HcpApi.getVerifiedHcpEnrollees({
          hcpId: hcp1.id,
          token,
        });
        const { errors } = res.body;
        const expectedError =
          'Access denied. As an HCP user, you can only view your own enrollees';
        expect(res.status).toBe(401);
        expect(errors[0]).toBe(expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
