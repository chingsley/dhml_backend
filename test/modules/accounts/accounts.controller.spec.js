/* eslint-disable jest/expect-expect */
import moment from 'moment';
import getEnrollees from '../../../src/shared/samples/enrollee.samples';
import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import ReportsApi from '../reports/reports.test.api';
import EnrolleeTest from '../enrollee/enrollee.test.service';
import getSampleVoucher from '../../../src/shared/samples/voucher.sample';
import _ReportService from '../reports/reports.test.service';
import AccountsApi from './accounts.test.api';
import AccountController from '../../../src/modules/account/account.controller';
import { dateInWords, months, nextMonth } from '../../../src/utils/timers';

const rateInNaira = Number(process.env.RATE_IN_NAIRA);
const { MD, HOD_AUDIT, HOD_ACCOUNT } = ROLES;

describe('AccountController', () => {
  describe('getApprovedMonthSpecificCapitation', () => {
    let sampleEnrollees, HCPs, seededPrincipals, seededDependants, res, token;
    let capSums, earliestCapSum, subjectMonth;
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
      await ReportsApi.getMonthlyCapSum('', token[HOD_ACCOUNT]);

      capSums = await _ReportService.findAllMCaps();
      earliestCapSum = capSums.sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
      )[0];

      // approve the capSum to allow audit;
      const voucher = getSampleVoucher(earliestCapSum.id);
      await ReportsApi.createVoucheer(voucher, token[HOD_ACCOUNT]);
      await ReportsApi.auditMonthlyCapSum(
        earliestCapSum.id,
        { auditStatus: 'audit pass' },
        token[HOD_AUDIT]
      );
      await ReportsApi.approveMonthlyCapSum(
        earliestCapSum.id,
        { approve: true },
        token[MD]
      );
      subjectMonth = moment(new Date(earliestCapSum.monthInWords)).format(
        'YYYY-MM-DD'
      );
      res = await AccountsApi.getApprovedMonthSpecificCapitation(
        subjectMonth,
        token[MD]
      );
    });

    it('returns status 200 on successful GET', async (done) => {
      try {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('groups the returned data by hcp states', async (done) => {
      try {
        const { data } = res.body;
        const hcpStates = HCPs.map((hcp) => hcp.state);
        Object.keys(data).map((state) => {
          expect(hcpStates.includes(state)).toBe(true);
        });
        done();
      } catch (e) {
        done(e);
      }
    });
    it('ensures that each group contains captition for hcps in the same state', async (done) => {
      try {
        const { data } = res.body;
        for (let [state, hcpCapitation] of Object.entries(data)) {
          for (let { hcp } of hcpCapitation) {
            expect(hcp.state).toEqual(state);
          }
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('ensures the total lives matches the sum of enrollees', async (done) => {
      try {
        const { data } = res.body;
        const mergedStateCapitations = Object.values(data).reduce(
          (acc, caps) => {
            acc = [...acc, ...caps];
            return acc;
          },
          []
        );
        const totalCapitationLives = mergedStateCapitations.reduce(
          (acc, cap) => {
            acc += parseInt(cap.lives);
            return acc;
          },
          0
        );
        const enrolleesVerifiedInSubjectMonth = [
          ...seededDependants,
          ...seededPrincipals,
        ].filter((enrollee) => {
          return (
            months.firstDay(enrollee.dateVerified) ===
            months.firstDay(subjectMonth)
          );
        });
        expect(enrolleesVerifiedInSubjectMonth).toHaveLength(
          totalCapitationLives
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('ensures total amount equals product sum of enrollees verified in subject and the rateInNaira', async (done) => {
      try {
        const { data } = res.body;
        const mergedStateCapitations = Object.values(data).reduce(
          (acc, caps) => {
            acc = [...acc, ...caps];
            return acc;
          },
          []
        );
        const totalAmount = mergedStateCapitations.reduce((acc, cap) => {
          acc += Number(cap.amount);
          return acc;
        }, 0);
        const enrolleesVerifiedInSubjectMonth = [
          ...seededDependants,
          ...seededPrincipals,
        ].filter((enrollee) => {
          return (
            months.firstDay(enrollee.dateVerified) ===
            months.firstDay(subjectMonth)
          );
        });
        expect(enrolleesVerifiedInSubjectMonth.length * rateInNaira).toEqual(
          totalAmount
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns 400 error if no capitations were found for the specified month', async (done) => {
      try {
        const date = nextMonth([subjectMonth]);
        const res = await AccountsApi.getApprovedMonthSpecificCapitation(
          date,
          token[MD]
        );
        expect(res.status).toBe(400);
        const {
          errors: [error],
        } = res.body;
        expect(error).toMatch(
          new RegExp(
            `There's no approved capitation for ${dateInWords(date)}`,
            'i'
          )
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(
        AccountController.getApprovedMonthSpecificCapitation
      )
    );
  });
});
