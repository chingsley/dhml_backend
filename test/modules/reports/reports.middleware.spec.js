/* eslint-disable jest/expect-expect */
import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import ReportsMiddleware from '../../../src/modules/reports/reports.middleware';
import ReportsApi from './reports.test.api';

const { MD, HOD_AUDIT } = ROLES;

describe('ReportsMiddleware', () => {
  describe('validateCapSumApproval', () => {
    let token;
    beforeAll(async () => {
      await TestService.resetDB();
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(sampleStaffs[0], MD);
      token = data.token;
    });

    it('returns status 200 on successful GET', async (done) => {
      try {
        const samples = [
          { payload: {}, expectedErr: '"approve" is required' },
          {
            payload: { approve___: true },
            expectedErr: '"approve" is required',
          },
          {
            payload: { approve: 'not boolean' },
            expectedErr: '"approve" must be a boolean',
          },
        ];
        for (let sample of samples) {
          const { payload, expectedErr } = sample;
          const res = await ReportsApi.approveMonthlyCapSum(1, payload, token);
          const { errors } = res.body;
          expect(res.status).toBe(400);
          expect(errors[0]).toEqual(expectedErr);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(ReportsMiddleware.validateCapSumApproval)
    );
  });
});
describe('validateCapSumAudit', () => {
  describe('validateCapSumApproval', () => {
    let token;
    beforeAll(async () => {
      await TestService.resetDB();
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(sampleStaffs[0], HOD_AUDIT);
      token = data.token;
    });

    it('returns status 200 on successful GET', async (done) => {
      try {
        const samples = [
          { payload: {}, expectedErr: '"auditStatus" is required' },
          {
            payload: { auditStatus___: 'audited' },
            expectedErr: '"auditStatus" is required',
          },
          {
            payload: { auditStatus: true },
            expectedErr:
              '"auditStatus" must be one of [audit pass, flagged, pending]',
          },
          {
            payload: { auditStatus: 'flagged' },
            expectedErr: '"flagReason" is required',
          },
        ];
        for (let sample of samples) {
          const { payload, expectedErr } = sample;
          const res = await ReportsApi.auditMonthlyCapSum(1, payload, token);
          const { errors } = res.body;
          expect(res.status).toBe(400);
          expect(errors[0]).toEqual(expectedErr);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(ReportsMiddleware.validateCapSumApproval)
    );
  });
});
