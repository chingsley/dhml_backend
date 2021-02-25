/* eslint-disable jest/expect-expect */
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import RefcodeApi from './refcode.test.api';
import RefcodeMiddleware from '../../../src/modules/refcode/refcode.middlewares';
import _RefcodeSamples from './refcode.test.samples';

describe('RefcodeMiddleware', () => {
  let token, res, payload;

  beforeAll(async () => {
    await TestService.resetDB();
    const sampleData = await _RefcodeSamples.initialize();
    payload = sampleData.payload;
    const { sampleStaffs } = getSampleStaffs(1);
    const data = await TestService.getToken(sampleStaffs[0], ROLES.SUPERADMIN);
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
