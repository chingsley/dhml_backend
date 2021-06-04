/* eslint-disable jest/expect-expect */
import moment from 'moment';
import getEnrollees from '../../../src/shared/samples/enrollee.samples';
import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import ReportsController from '../../../src/modules/reports/reports.controller';
import ReportsApi from '../reports/reports.test.api';
import EnrolleeTest from '../enrollee/enrollee.test.service';
import getSampleVoucher from '../../../src/shared/samples/voucher.sample';
import { AUDIT_STATUS } from '../../../src/shared/constants/lists.constants';
import _ReportService from '../reports/reports.test.service';
import AccountsApi from './accounts.test.api';

const rateInNaira = Number(process.env.RATE_IN_NAIRA);
const { MD, HOD_AUDIT, HOD_ACCOUNT } = ROLES;
const { pending, flagged, auditPass } = AUDIT_STATUS;

describe('AccountController', () => {
  describe('getApprovedMonthSpecificCapitation', () => {
    let sampleEnrollees, HCPs, seededPrincipals, seededDependants, res, token;
    let capSums, earliestCapSum;
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
      const __res = await ReportsApi.auditMonthlyCapSum(
        earliestCapSum.id,
        { auditStatus: 'audit pass' },
        token[HOD_AUDIT]
      );
      const _res = await ReportsApi.approveMonthlyCapSum(
        earliestCapSum.id,
        { approve: true },
        token[MD]
      );
      console.log(
        __res.body,
        _res.body,
        moment(new Date(earliestCapSum.monthInWords)).format('YYYY-DD-MM')
      );
      res = await AccountsApi.getApprovedMonthSpecificCapitation(
        moment(new Date(earliestCapSum.monthInWords)).format('YYYY-MM-DD'),
        token[MD]
      );
    });

    it.only('returns status 200 on successful GET', async (done) => {
      try {
        console.log(res.body);
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
    it('ensures the monthly capitation sum is cummulative', async (done) => {
      try {
        const { rows } = res.body.data;
        for (let i = 0; i < rows.length - 1; i++) {
          expect(rows[i].lives).toBeGreaterThanOrEqual(rows[i + 1].lives);
          expect(rows[i].amount).toBeGreaterThanOrEqual(rows[i + 1].amount);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('ensures the capitation for current month returns correct values for number of lives and amount', async (done) => {
      try {
        const { rows } = res.body.data;
        const totalLives = seededPrincipals.length + seededDependants.length;
        expect(rows[0].lives).toEqual(totalLives);
        expect(rows[0].amount).toEqual(totalLives * rateInNaira);
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
        const res = await ReportsApi.getMonthlyCapSum('', token[HOD_ACCOUNT]);
        expect(res.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns empty result for MD and AUDITOR if VOUCHER is not yet created for any record', async (done) => {
      try {
        for (let token of [token[HOD_AUDIT], token[MD]]) {
          const res = await ReportsApi.getMonthlyCapSum('', token);
          const { count, rows } = res.body.data;
          expect(res.status).toBe(200);
          expect(count).toBe(0);
          expect(rows).toHaveLength(0);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns empty result for MD if there"s no record with audit pass', async (done) => {
      try {
        const res = await ReportsApi.getMonthlyCapSum('', token[MD]);
        const { count, rows } = res.body.data;
        expect(res.status).toBe(200);
        expect(count).toBe(0);
        expect(rows).toHaveLength(0);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('ensures auditor can see records that have voucher; but MD will not', async (done) => {
      try {
        const { rows } = res.body.data;
        const earliestCapSum = rows[rows.length - 1];
        const voucher = getSampleVoucher(earliestCapSum.id);
        await ReportsApi.createVoucheer(voucher, token[HOD_ACCOUNT]);
        const res2 = await ReportsApi.getMonthlyCapSum('', token[HOD_AUDIT]);
        expect(res2.body.data.count).toBe(1);
        expect(res2.body.data.rows).toHaveLength(1);
        expect(res2.body.data.rows[0].id).toEqual(voucher.gmcId);

        const res3 = await ReportsApi.getMonthlyCapSum('', token[MD]);
        expect(res3.body.data.count).toBe(0);
        expect(res3.body.data.rows).toHaveLength(0);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('ensures MD will not see audited, but flagged records', async (done) => {
      try {
        const { rows } = res.body.data;
        const earliestCapSum = rows[rows.length - 1];
        const voucher = getSampleVoucher(earliestCapSum.id);
        await ReportsApi.createVoucheer(voucher, token[HOD_ACCOUNT]);
        const summaryId = earliestCapSum.id;
        const payload = {
          auditStatus: flagged,
          flagReason: 'testing...',
        };
        await ReportsApi.auditMonthlyCapSum(
          summaryId,
          payload,
          token[HOD_AUDIT]
        );
        const res2 = await ReportsApi.getMonthlyCapSum('', token[MD]);
        expect(res2.body.data.count).toBe(0);
        expect(res2.body.data.rows).toHaveLength(0);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('ensures MD can see audited records with status "audit pass"', async (done) => {
      try {
        const { rows } = res.body.data;
        const earliestCapSum = rows[rows.length - 1];
        const voucher = getSampleVoucher(earliestCapSum.id);
        await ReportsApi.createVoucheer(voucher, token[HOD_ACCOUNT]);
        const summaryId = earliestCapSum.id;
        const payload = { auditStatus: auditPass };
        await ReportsApi.auditMonthlyCapSum(
          summaryId,
          payload,
          token[HOD_AUDIT]
        );
        const res2 = await ReportsApi.getMonthlyCapSum('', token[MD]);
        expect(res2.body.data.count).toBe(1);
        expect(res2.body.data.rows).toHaveLength(1);
        expect(res2.body.data.rows[0].id).toEqual(voucher.gmcId);
        done();
      } catch (e) {
        done(e);
      }
    });

    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(ReportsController.getGeneralMonthlyCapitation)
    );
  });
});
