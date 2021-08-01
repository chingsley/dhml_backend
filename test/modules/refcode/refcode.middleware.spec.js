/* eslint-disable jest/expect-expect */
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import RefcodeApi from './refcode.test.api';
import RefcodeMiddleware from '../../../src/modules/refcode/refcode.middlewares';
import _RefcodeService from './refcode.test.service';
import SampleReferalCodes from '../../../src/shared/samples/refcode.samples';

describe('RefcodeMiddleware', () => {
  describe('validateRequestForRefcode', () => {
    let token, res, payload;

    beforeAll(async () => {
      await TestService.resetDB();
      payload = _RefcodeService.decoratePayload(
        SampleReferalCodes.generateSampleRefcodeRequest({
          enrolleeIdNo: '2292',
          referringHcpId: 2,
          receivingHcpId: 3,
          specialtyId: '24c5676a-6cd6-4b1b-886e-bec3b59e0ba9',
        })
      );
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(sampleStaffs[0], ROLES.MD);
      token = data.token;
    });
    it('rejects incomplete data', async (done) => {
      try {
        for (let field of Object.keys(payload.data).filter(
          (fld) => fld !== 'enrolleeIdNo'
        )) {
          res = await RefcodeApi.requestForCode(payload.remove(field), token);
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
      TestService.testCatchBlock(RefcodeMiddleware.validateRequestForRefcode)
    );
  });
});
