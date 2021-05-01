/* eslint-disable jest/expect-expect */
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import RefcodeApi from './refcode.test.api';
import RefcodeMiddleware from '../../../src/modules/refcode/refcode.middlewares';
import _RefcodeSamples from './refcode.test.samples';

describe('RefcodeMiddleware', () => {
  describe('validateNewRefcode', () => {
    let token, res, payload;

    beforeAll(async () => {
      await TestService.resetDB();
      const sampleData = await _RefcodeSamples.initialize();
      payload = sampleData.payload;
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.SUPERADMIN
      );
      token = data.token;
    });
    it('rejects incomplete data', async (done) => {
      try {
        for (let field of Object.keys(payload.data)) {
          res = await RefcodeApi.generateNewCode(payload.remove(field), token);
          const { errors } = res.body;
          expect(errors[0]).toBe(`"${field}" is required`);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(RefcodeMiddleware.validateNewRefcode)
    );
  });
  describe('validateRefcode', () => {
    let token;

    beforeAll(async () => {
      await TestService.resetDB();
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.SUPERADMIN
      );
      token = data.token;
    });
    it('returns error with status 400 for invalid referal code', async (done) => {
      try {
        const res = await RefcodeApi.verifyRefcode('123456', token);
        const { errors } = res.body;
        expect(res.status).toBe(400);
        const expectedError =
          'Invalid Referal Code. Please check the code and try again.';
        expect(errors[0]).toEqual(expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(RefcodeMiddleware.validateRefcode)
    );
  });
  describe('validateFlagStatus', () => {
    let token;

    beforeAll(async () => {
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.SUPERADMIN
      );
      token = data.token;
    });
    it('returns 400 error for invalid refcodeId', async (done) => {
      try {
        const invalidIds = ['5a', -1];
        for (let invalidId of invalidIds) {
          const res = await RefcodeApi.changeFlagStatus(
            invalidId,
            { flag: false },
            token
          );
          expect(res.status).toBe(400);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('validates the payload', async (done) => {
      try {
        const invalidPayloads = [
          { flag: 'not-boolean' },
          { flag: 2 },
          { notFlag: true },
        ];
        for (let payload of invalidPayloads) {
          const res = await RefcodeApi.changeFlagStatus(1, payload, token);
          expect(res.status).toBe(400);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(RefcodeMiddleware.validateFlagStatus)
    );
  });
  describe('validateRefcodeIdArr', () => {
    let token;

    beforeAll(async () => {
      await TestService.resetDB();
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.SUPERADMIN
      );
      token = data.token;
    });
    it('returns status 200 on successful delete', async (done) => {
      try {
        const invalidPayloads = [
          { refcodeIds: ['1a'] }, // non-integer
          { refcodeIds: [-1] }, // negetive value
          { refcodeIds: [1, 1] }, // duplicate values
        ];
        for (let payload of invalidPayloads) {
          const res = await RefcodeApi.deleteRefcode(payload, token);
          expect(res.status).toBe(400);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(RefcodeMiddleware.validateRefcodeIdArr)
    );
  });
  describe('validateRefcodeQuery', () => {
    let token;

    beforeAll(async () => {
      await TestService.resetDB();
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.SUPERADMIN
      );
      token = data.token;
    });
    it('returns error with status 400 for invalid referal code', async (done) => {
      try {
        const invalidQueries = [
          {
            query: 'page=-1',
            expectedError: '"page" must be larger than or equal to 0',
          },
          {
            query: 'pageSize=-0',
            expectedError: '"pageSize" must be larger than or equal to 1',
          },
          {
            query: 'isFlagged=notBollean',
            expectedError: '"isFlagged" must be one of [true, false]',
          },
        ];
        for (let { query, expectedError } of invalidQueries) {
          const res = await RefcodeApi.getReferalCodes(query, token);
          const { errors } = res.body;
          expect(res.status).toBe(400);
          expect(errors[0]).toEqual(expectedError);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(RefcodeMiddleware.validateRefcodeQuery)
    );
  });
  describe('getEnrolleeCodeHistory', () => {
    let token;

    beforeAll(async () => {
      await TestService.resetDB();
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.SUPERADMIN
      );
      token = data.token;
    });
    it('returns status 400 for missing query', async (done) => {
      try {
        const res = await RefcodeApi.getEnrolleeCodeHistory('', token);
        expect(res.status).toBe(400);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns status 400 for missing query with enrolleeIdNo', async (done) => {
      try {
        const res = await RefcodeApi.getEnrolleeCodeHistory(
          'not_enrolleeIdNo=123456',
          token
        );
        expect(res.status).toBe(400);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns status 400 for non-string enrolleeIdNo', async (done) => {
      try {
        const invalidFormat = { enrolleeIdNo: 123456 };
        const res = await RefcodeApi.getEnrolleeCodeHistory(
          `enrolleeIdNo=${invalidFormat}`,
          token
        );
        expect(res.status).toBe(400);
        done();
      } catch (e) {
        done(e);
      }
    });

    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(RefcodeMiddleware.validateFetchCodeHistory)
    );
  });
});
