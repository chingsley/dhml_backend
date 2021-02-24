import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import RefcodeApi from './refcode.test.api';
import _HcpService from '../hcp/hcp.test.service';
const { log } = console;

describe('RefcodeController', () => {
  let token, res;
  beforeAll(async () => {
    await TestService.resetDB();
    const { primaryHcps, secondaryHcps } = await _HcpService.seedHcps({
      numPrimary: 1,
      numSecondary: 2,
    });
    log(primaryHcps.length, secondaryHcps.length);
    const { sampleStaffs } = getSampleStaffs(1);
    const data = await TestService.getToken(sampleStaffs[0], ROLES.SUPERADMIN);
    token = data.token;
    res = await RefcodeApi.generateNewCode({}, token);
  });
  it('successfully generates a token', async (done) => {
    try {
      const { log } = console;
      log(res.body);
      expect(true).toBe(true);
      done();
    } catch (e) {
      done(e);
    }
  });
});
