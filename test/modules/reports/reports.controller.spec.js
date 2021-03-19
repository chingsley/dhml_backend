/* eslint-disable jest/expect-expect */
import { v2 as cloudinary } from 'cloudinary';
import faker from 'faker';
import { days, months } from '../../../src/utils/timers';

import getEnrollees from '../../../src/shared/samples/enrollee.samples';
import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import { randInt } from '../../../src/utils/helpers';
import ReportsController from '../../../src/modules/reports/reports.controller';
import ReportsApi from './reports.test.api';

const originalImplementation = cloudinary.uploader.upload;
const SAMPLE_IMG_URL = faker.image.imageUrl();

describe('ReportsController', () => {
  beforeAll(() => {
    cloudinary.uploader.upload = jest
      .fn()
      .mockReturnValue({ url: SAMPLE_IMG_URL });
  });
  afterAll(() => {
    cloudinary.uploader.upload = originalImplementation;
  });
  describe('getMonthlyCapitationSummary', () => {
    let sampleEnrollees, token, HCPs, seededPrincipals, seededDependants, res;
    beforeAll(async () => {
      await TestService.resetDB();
      HCPs = await TestService.seedHCPs(4);
      const { sampleStaffs } = getSampleStaffs(2);
      sampleEnrollees = getEnrollees({
        numOfPrincipals: 40,
        sameSchemeDepPerPrincipal: 2,
      });
      const principals = sampleEnrollees.principals;
      seededPrincipals = await TestService.seedEnrollees(
        principals.map((principal, i) => ({
          ...principal,
          scheme: 'AFRSHIP',
          enrolmentType: 'principal',
          serviceNumber: `NN/000${i}`,
          hcpId: HCPs[randInt(0, 3)].id,
          isVerified: true,
          dateVerified: faker.date.between(months.setPast(3), days.today),
          staffNumber: null,
        }))
      );
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
      const data = await TestService.getToken(sampleStaffs[0], ROLES.MD);
      token = data.token;
      res = await ReportsApi.getMonthlyCapSum('', token);
    });

    it('returns status 200 on successful GET', async (done) => {
      try {
        expect(res.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });

    it('returns the monthly capitation summary in descending order of month', async (done) => {
      try {
        const { rows } = res.body.data;
        for (let i = 0; i < rows.length - 1; i++) {
          expect(new Date(rows[i].month).getTime()).toBeGreaterThan(
            new Date(rows[i + 1].month).getTime()
          );
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns ensures the monthly capitation sum is cummulative', async (done) => {
      try {
        const { rows } = res.body.data;
        for (let i = 0; i < rows.length - 1; i++) {
          expect(rows[i].lives).toBeGreaterThan(rows[i + 1].lives);
          expect(rows[i].amount).toBeGreaterThan(rows[i + 1].amount);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    // it('ensures the current month "running month" is not available for approval', async (done) => {
    //   try {
    //     const { rows } = res.body.data;
    //     expect(new Date(rows[0].month).getTime()).toBeLessThan(
    //       new Date(months.currentMonth).getTime()
    //     );
    //     done();
    //   } catch (e) {
    //     done(e);
    //   }
    // });
    it('ensures the current month "running month" (not returned in API) contains the total lives', async (done) => {
      try {
        const { rows } = res.body.data;
        const totalLives = seededPrincipals.length + seededDependants.length;
        expect(rows[0].lives).toEqual(totalLives);
        expect(rows[0].amount).toEqual(totalLives * 750);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('initializes the approval dates and flagReason to null', async (done) => {
      try {
        const { rows } = res.body.data;
        for (let record of rows) {
          expect(record.dateApproved).toBe(null);
          expect(record.dateAudited).toBe(null);
          expect(record.datePaid).toBe(null);
          expect(record.flagReason).toBe(null);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('initializes the record if not exist otherwise, it updates the existing record', async (done) => {
      try {
        const res = await ReportsApi.getMonthlyCapSum('', token);
        expect(res.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });

    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(ReportsController.getMonthlyCapitationSummary)
    );
  });
});
