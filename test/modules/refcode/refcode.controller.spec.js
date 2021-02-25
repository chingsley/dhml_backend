/* eslint-disable jest/expect-expect */
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import RefcodeApi from './refcode.test.api';
import _RefcodeSamples from './refcode.test.samples';
import RefcodeController from '../../../src/modules/refcode/refcode.controllers';
import Jwt from '../../../src/utils/Jwt';
// const { log } = console;

describe('RefcodeController', () => {
  let token, res, samplePayload;
  let secondaryHcps, seededAfrshipPrincipals;
  const responses = [];

  beforeAll(async () => {
    await TestService.resetDB();
    const sampleData = await _RefcodeSamples.initialize();
    samplePayload = sampleData.payload;
    secondaryHcps = sampleData.secondaryHcps;
    seededAfrshipPrincipals = sampleData.seededAfrshipPrincipals;
    const { sampleStaffs } = getSampleStaffs(1);
    const data = await TestService.getToken(sampleStaffs[0], ROLES.SUPERADMIN);
    token = data.token;

    for (let i = 0; i < seededAfrshipPrincipals.length; i++) {
      const payload = samplePayload.set({
        enrolleeId: seededAfrshipPrincipals[i].id,
        destinationHcpId: secondaryHcps[0].id,
      });
      const res = await RefcodeApi.generateNewCode(payload, token);
      responses.push({ payload, res });
    }
    res = responses[0].res;
  });
  it('returns status 201 on successful code generation', async (done) => {
    try {
      // log(res.body);
      expect(res.status).toBe(201);
      done();
    } catch (e) {
      done(e);
    }
  });
  it('ensures the generated code matches the required format', async (done) => {
    try {
      const { data } = res.body;
      expect(data.code).toMatch(/\w\w\/\d\d\d\d\d\d\/022\/(\d)*\w-\d\/\w/);
      done();
    } catch (e) {
      done(e);
    }
  });
  it('generates a proxy code for the referal code', async (done) => {
    try {
      const { data } = res.body;
      expect(data.proxyCode).toBeTruthy();
      done();
    } catch (e) {
      done(e);
    }
  });
  it('sets the default "flag" status of the code to "false"', async (done) => {
    try {
      const { data } = res.body;
      expect(data.isFlagged).toBe(false);
      done();
    } catch (e) {
      done(e);
    }
  });
  it('saves the id of the user that generated the code', async (done) => {
    try {
      const { data } = res.body;
      const { userId } = Jwt.decode(token);
      expect(data.operatorId).toBe(userId);
      done();
    } catch (e) {
      done(e);
    }
  });
  it('creates multiple codes for the same enrollee', async (done) => {
    try {
      responses.forEach(({ res }, i) => {
        const { data } = res.body;
        const matched = data.code.match(/\b(\d)*\w-\d\b/);
        const codeSerialNumber = matched[0].split('-')[1];
        expect(Number(codeSerialNumber)).toEqual(i + 1);
      });
      done();
    } catch (e) {
      done(e);
    }
  });
  it(
    'it catches errors thrown in the try block',
    TestService.testCatchBlock(RefcodeController.generateNewCode)
  );
});
