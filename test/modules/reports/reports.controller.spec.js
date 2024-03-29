/* eslint-disable jest/expect-expect */
import getEnrollees from '../../../src/shared/samples/enrollee.samples';
import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import ReportsController from '../../../src/modules/reports/reports.controller';
import ReportsApi from './reports.test.api';
import EnrolleeTest from '../enrollee/enrollee.test.service';
import _ReportService from './reports.test.service';
import moment from 'moment';
import getSampleVoucher from '../../../src/shared/samples/voucher.sample';
import { AUDIT_STATUS } from '../../../src/shared/constants/lists.constants';

const rateInNaira = Number(process.env.RATE_IN_NAIRA);
const { MD, HOD_AUDIT, HOD_ACCOUNT } = ROLES;
const { pending, flagged, auditPass } = AUDIT_STATUS;

describe('ReportsController', () => {
  describe('getGeneralMonthlyCapitation', () => {
    let sampleEnrollees, HCPs, seededPrincipals, seededDependants, res, token;
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
      res = await ReportsApi.getMonthlyCapSum('', token[HOD_ACCOUNT]);
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
  describe('auditMonthlyCapitationSummary', () => {
    let sampleEnrollees, HCPs, capSums, token, capSumPreviousMonth;
    const today = moment().format('YYYY-MM-DD');
    beforeAll(async () => {
      await TestService.resetDB();
      HCPs = await TestService.seedHCPs(4);
      sampleEnrollees = getEnrollees({
        numOfPrincipals: 40,
        sameSchemeDepPerPrincipal: 2,
      });
      await EnrolleeTest.seedAfrship(sampleEnrollees, HCPs);
      token = await TestService.getTokenMultiple(
        [MD, HOD_AUDIT, HOD_ACCOUNT],
        getSampleStaffs(3).sampleStaffs
      );

      // this will execute the query to update the MonthlyCapSum table
      await ReportsApi.getMonthlyCapSum('', token[HOD_ACCOUNT]);

      capSums = await _ReportService.findAllMCaps();
      capSumPreviousMonth = capSums.sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
      )[0];

      // approve the capSum to allow audit;
      const voucher = getSampleVoucher(capSumPreviousMonth.id);
      await ReportsApi.createVoucheer(voucher, token[HOD_ACCOUNT]);
    });

    it('can successfully mark a report as audited', async (done) => {
      try {
        const capSum = capSumPreviousMonth;
        const payload = { auditStatus: auditPass };
        const res = await ReportsApi.auditMonthlyCapSum(
          capSum.id,
          payload,
          token[HOD_AUDIT]
        );
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(data.auditStatus).toBe(payload.auditStatus);
        const auditDate = moment(data.dateAudited).format('YYYY-MM-DD');
        expect(auditDate).toEqual(today);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can undo the audit and set it to pending ', async (done) => {
      try {
        const capSum = capSumPreviousMonth;
        const payload = { auditStatus: pending };
        const res = await ReportsApi.auditMonthlyCapSum(
          capSum.id,
          payload,
          token[HOD_AUDIT]
        );
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(data.auditStatus).toBe(payload.auditStatus);
        expect(data.dateAudited).toBe(null);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can flag the report and specify a flag reason', async (done) => {
      try {
        const capSum = capSumPreviousMonth;
        const payload = { auditStatus: flagged, flagReason: 'some reason' };
        const res = await ReportsApi.auditMonthlyCapSum(
          capSum.id,
          payload,
          token[HOD_AUDIT]
        );
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(data.auditStatus).toBe(payload.auditStatus);
        expect(data.flagReason).toBe(payload.flagReason);
        const auditDate = moment(data.dateAudited).format('YYYY-MM-DD');
        expect(auditDate).toEqual(today);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('cannot audit a report if voucher has not been created for the record', async (done) => {
      try {
        const capSum = capSumPreviousMonth;
        // this next next line will cancel previous created voucher for the capsum if there were any
        await _ReportService.deleteCapSumVoucher(capSum.id);
        const payload = { auditStatus: auditPass };
        const res = await ReportsApi.auditMonthlyCapSum(
          capSum.id,
          payload,
          token[HOD_AUDIT]
        );
        const { errors } = res.body;
        expect(res.status).toBe(400);
        expect(errors[0]).toEqual(
          'This captitation has not been marked ready for audit.'
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(
        ReportsController.auditMonthlyCapitationSummary
      )
    );
  });
  describe('approveMonthlyCapitationSummary', () => {
    let sampleEnrollees, HCPs, capSums, token, capSumOlderMonth;
    const today = moment().format('YYYY-MM-DD');
    beforeAll(async () => {
      await TestService.resetDB();
      HCPs = await TestService.seedHCPs(4);
      sampleEnrollees = getEnrollees({
        numOfPrincipals: 40,
        sameSchemeDepPerPrincipal: 2,
      });
      await EnrolleeTest.seedAfrship(sampleEnrollees, HCPs);
      token = await TestService.getTokenMultiple(
        [MD, HOD_AUDIT, HOD_ACCOUNT],
        getSampleStaffs(3).sampleStaffs
      );

      // this will execute the query to update the MonthlyCapSum table
      await ReportsApi.getMonthlyCapSum('', token[HOD_ACCOUNT]);
      capSums = await _ReportService.findAllMCaps();
      capSumOlderMonth = capSums.sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
      )[0];
      const voucher = getSampleVoucher(capSumOlderMonth.id);
      await ReportsApi.createVoucheer(voucher, token[HOD_ACCOUNT]);
      await ReportsApi.auditMonthlyCapSum(
        capSumOlderMonth.id,
        { auditStatus: auditPass },
        token[HOD_AUDIT]
      );
    });

    it('successfully approves a capitation summary', async (done) => {
      try {
        const capSum = capSumOlderMonth;
        const payload = { approve: true };
        const res = await ReportsApi.approveMonthlyCapSum(
          capSum.id,
          payload,
          token[MD]
        );
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(data.isApproved).toBe(true);
        const approvedDate = moment(data.dateApproved).format('YYYY-MM-DD');
        expect(approvedDate).toEqual(moment(today).format('YYYY-MM-DD'));
        done();
      } catch (e) {
        done(e);
      }
    });
    it('fails if the the capitation sum has already been paid for', async (done) => {
      try {
        const capSum = capSumOlderMonth;
        await capSum.update({ datePaid: new Date() });
        const payloads = [{ approve: true }, { approve: false }];
        for (let payload of payloads) {
          const res = await ReportsApi.approveMonthlyCapSum(
            capSum.id,
            payload,
            token[MD]
          );
          expect(res.status).toBe(400);
          const expectedErr =
            'Cannot change approval, capitation has been paid.';
          const { errors } = res.body;
          expect(errors[0]).toEqual(expectedErr);
        }
        await capSum.update({ datePaid: null });
        done();
      } catch (e) {
        done(e);
      }
    });
    it('fails if the the capitation sum is for the current month', async (done) => {
      try {
        const capSum = capSumOlderMonth;
        const capSumMonth = capSum.month;
        await capSum.update({ month: moment().clone().startOf('month') });
        const payload = { approve: true };
        const res = await ReportsApi.approveMonthlyCapSum(
          capSum.id,
          payload,
          token[MD]
        );
        const expectedErr =
          'Operation not allowed on current running capitation until month end';
        const { errors } = res.body;
        expect(errors[0]).toEqual(expectedErr);
        capSumOlderMonth.month = capSumMonth;
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns 401 for unauthorzed role', async (done) => {
      try {
        const capSum = capSumOlderMonth;
        const payload = { approve: true };
        const res = await ReportsApi.approveMonthlyCapSum(
          capSum.id,
          payload,
          token[HOD_AUDIT]
        );
        const { errors, errorCode } = res.body;
        expect(res.status).toBe(401);
        expect(errors[0]).toBe('Access denied');
        expect(errorCode).toEqual('AUTH004');
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(
        ReportsController.approveMonthlyCapitationSummary
      )
    );
  });
  describe('payMonthlyCapitation', () => {
    let sampleEnrollees, HCPs, capSums, token, capSumPreviousMonth;
    const today = moment().format('YYYY-MM-DD');
    beforeAll(async () => {
      await TestService.resetDB();
      HCPs = await TestService.seedHCPs(4);
      sampleEnrollees = getEnrollees({
        numOfPrincipals: 40,
        sameSchemeDepPerPrincipal: 2,
      });
      await EnrolleeTest.seedAfrship(sampleEnrollees, HCPs);
      token = await TestService.getTokenMultiple(
        [MD, HOD_ACCOUNT],
        getSampleStaffs(3).sampleStaffs
      );

      await ReportsApi.getMonthlyCapSum('', token[MD]);

      capSums = await _ReportService.findAllMCaps();
      capSumPreviousMonth = capSums.sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
      )[0];

      // approve the capSum to allow audit;
      await capSumPreviousMonth.update({ dateApproved: today });
    });

    it('can successfully mark a report as paid', async (done) => {
      try {
        const capSum = capSumPreviousMonth;
        const res = await ReportsApi.payMonthlyCapSum(
          capSum.id,
          token[HOD_ACCOUNT]
        );
        const { data } = res.body;
        expect(res.status).toBe(200);
        const paymentDate = moment(data.datePaid).format('YYYY-MM-DD');
        expect(paymentDate).toEqual(today);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('cannot pay for a report before approval', async (done) => {
      try {
        const capSum = capSumPreviousMonth;
        await capSum.update({ dateApproved: null });
        const res = await ReportsApi.payMonthlyCapSum(
          capSum.id,
          token[HOD_ACCOUNT]
        );
        const { errors } = res.body;
        expect(res.status).toBe(400);
        expect(errors[0]).toEqual(
          'Cannot pay for capitation before MD"s approval'
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(ReportsController.payMonthlyCapitation)
    );
  });
});
