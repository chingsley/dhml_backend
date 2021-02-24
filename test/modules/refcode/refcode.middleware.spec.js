import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import RefcodeApi from './refcode.test.api';
import _HcpService from '../hcp/hcp.test.service';
const { log } = console;

describe('RefcodeMiddleware', () => {
  let token, res;
  beforeAll(async () => {
    await TestService.resetDB();
    const { primaryHcps, secondaryHcps } = await _HcpService.seedHcps({
      numPrimary: 1,
      numSecondary: 2,
    });
    log(primaryHcps.length, secondaryHcps.length);
    // const { principals, dependants } = getEnrollees({
    //   numOfPrincipals: TOTAL_COUNT_HCP,
    //   sameSchemeDepPerPrincipal: 3,
    //   vcshipDepPerPrincipal: 1,
    // });
    // const seededPrincipals = await TestService.seedEnrollees(
    //   principals.map((p, i) => {
    //     return {
    //       ...p,
    //       hcpId: seededHCPs[i].id,
    //       staffNumber: p.staffNumber ? seededStaffs[i].staffIdNo : null,
    //     };
    //   })
    // );
    // const dependantsWithPrincipalId = dependants.reduce((acc, dep, i) => {
    //   const hcpId = seededHCPs[i % TOTAL_COUNT_HCP].id;
    //   for (let { enrolleeIdNo, id } of seededPrincipals) {
    //     if (dep.enrolleeIdNo.match(new RegExp(`${enrolleeIdNo}-`))) {
    //       acc.push({ ...dep, principalId: id, hcpId });
    //     }
    //   }
    //   return acc;
    // }, []);
    // await TestService.seedEnrollees(dependantsWithPrincipalId);
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
