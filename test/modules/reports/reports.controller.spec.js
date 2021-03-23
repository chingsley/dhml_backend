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

const { MD, HOD_AUDIT, HOD_ACCOUNT } = ROLES;

describe('ReportsController', () => {
  describe('getMonthlyCapitationSummary', () => {
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
      res = await ReportsApi.getMonthlyCapSum('', token[MD]);
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
        const res = await ReportsApi.getMonthlyCapSum('', token[MD]);
        expect(res.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns empty result for non-MD role if no record is approved yet', async (done) => {
      try {
        for (let token of [token[HOD_ACCOUNT], token[HOD_AUDIT]]) {
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

    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(ReportsController.getMonthlyCapitationSummary)
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
      await ReportsApi.getMonthlyCapSum('', token[MD]);
      capSums = await _ReportService.findAllMCaps();
      capSumOlderMonth = capSums.sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
      )[0];
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
            'cannot change approval, capitation has been paid for';
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
        const capSum = capSums.sort(
          (a, b) => new Date(b.month).getTime() - new Date(a.month).getTime()
        )[0];
        await capSum.update({ month: moment().clone().startOf('month') });
        const payload = { approve: true };
        const res = await ReportsApi.approveMonthlyCapSum(
          capSum.id,
          payload,
          token[MD]
        );
        const expectedErr =
          'Operation not allowed on current running capitation';
        const { errors } = res.body;
        expect(errors[0]).toEqual(expectedErr);
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
});
