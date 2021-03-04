/* eslint-disable jest/expect-expect */
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import RefcodeApi from './refcode.test.api';
import _RefcodeSamples from './refcode.test.samples';
import RefcodeController from '../../../src/modules/refcode/refcode.controllers';
import Jwt from '../../../src/utils/Jwt';
import { VALID_REF_CODE } from '../../../src/validators/joi/schemas/refcode.schema';
import _HcpService from '../hcp/hcp.test.service';
import getEnrollees from '../../../src/shared/samples/enrollee.samples';
import SampleReferalCodes from '../../../src/shared/samples/refcode.samples';
import _RefcodeService from './refcode.test.service';
require('../../../src/prototypes/array.extensions').extendArray();

describe('RefcodeController', () => {
  describe('generateNewCode', () => {
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
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.SUPERADMIN
      );
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
        expect(res.status).toBe(201);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('ensures the generated code matches the required format', async (done) => {
      try {
        const { data } = res.body;
        expect(data.code).toMatch(VALID_REF_CODE);
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
    it('returns associated models', async (done) => {
      try {
        const { data } = res.body;
        expect(data).toHaveProperty('enrollee');
        expect(data).toHaveProperty('destinationHcp');
        expect(data).toHaveProperty('generatedBy');
        expect(data.enrollee).toHaveProperty('hcp');
        expect(data.generatedBy).toHaveProperty('staffInfo');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('creates multiple codes for the same enrollee', async (done) => {
      try {
        responses.forEach(({ res }, i) => {
          const { data } = res.body;
          expect(data.code).toMatch(VALID_REF_CODE);
          const matched = data.code.match(/\b(\d)*[A-Z]-(\d)*\b/);
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
  describe('verifyReferalCode', () => {
    let token, res;

    beforeAll(async () => {
      await TestService.resetDB();
      const { primaryHcps, secondaryHcps } = await _HcpService.seedHcps({
        numPrimary: 1,
        numSecondary: 3,
      });
      const { principals } = getEnrollees({ numOfPrincipals: 1 });
      const [seededPrincipal] = await TestService.seedEnrollees(
        principals.map((p) => ({ ...p, hcpId: primaryHcps[0].id }))
      );
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.SUPERADMIN
      );
      token = data.token;
      const { userId } = Jwt.decode(token);
      const refcodes = SampleReferalCodes.getTestSeed({
        enrollees: [seededPrincipal].repreatElement(6),
        secondaryHcps,
        operatorId: userId,
      });
      const seededRefcodes = await _RefcodeService.seedBulk(refcodes);
      res = await RefcodeApi.verifyRefcode(seededRefcodes[0].code, token);
    });
    it('returns status 200 for a valid code', async (done) => {
      try {
        // console.log(res.body);
        expect(res.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns the enrollee and destinationHcp associated to the code', async (done) => {
      try {
        const { data } = res.body;
        const { enrollee, destinationHcp } = data;
        expect(data.enrolleeId).toEqual(enrollee.id);
        expect(data.destinationHcpId).toEqual(destinationHcp.id);
        expect(res.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns the last 5 codes of the the associated enrollee', async (done) => {
      try {
        const {
          data: { enrollee },
        } = res.body;
        expect(enrollee.referalCodes).toHaveLength(5);
        expect(res.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns a 400 error if the code does not exist', async (done) => {
      try {
        const res = await RefcodeApi.verifyRefcode(
          'JJ/050121/022/1C-1/AD',
          token
        );
        const {
          errors: [error],
        } = res.body;
        const expectedError = 'Invalid code. No record found';
        expect(error).toBe(expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(RefcodeController.verifyReferalCode)
    );
  });
  describe('changeFlagStatus (flag/approve referal code)', () => {
    let token, refcode1, refcode2;

    beforeAll(async () => {
      await TestService.resetDB();
      const { primaryHcps, secondaryHcps } = await _HcpService.seedHcps({
        numPrimary: 1,
        numSecondary: 3,
      });
      const { principals } = getEnrollees({ numOfPrincipals: 1 });
      const [seededPrincipal] = await TestService.seedEnrollees(
        principals.map((p) => ({ ...p, hcpId: primaryHcps[0].id }))
      );
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.SUPERADMIN
      );
      token = data.token;
      const { userId } = Jwt.decode(token);
      const refcodes = SampleReferalCodes.getTestSeed({
        enrollees: [seededPrincipal].repreatElement(2),
        secondaryHcps,
        operatorId: userId,
      });
      [refcode1, refcode2] = await _RefcodeService.seedBulk(refcodes);
    });
    it('successfully flags a referal code', async (done) => {
      try {
        const res = await RefcodeApi.changeFlagStatus(
          refcode1.id,
          { flag: true },
          token
        );
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(data).toHaveProperty('isFlagged', true);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('successfully approves a flagged code', async (done) => {
      try {
        await refcode2.update({ isFlagged: true });
        expect(refcode2.isFlagged).toBe(true);
        const res = await RefcodeApi.changeFlagStatus(
          refcode2.id,
          { flag: false },
          token
        );
        await refcode2.reload();
        expect(res.status).toBe(200);
        expect(refcode2.isFlagged).toBe(false);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns 400 error for a non-exsisting refcodeId', async (done) => {
      try {
        const invalidId = refcode2.id * 5;
        const res = await RefcodeApi.changeFlagStatus(
          invalidId,
          { flag: false },
          token
        );
        const { errors } = res.body;
        const expectedError = `no referal code matches the id of ${invalidId}`;
        expect(res.status).toBe(400);
        expect(errors[0]).toEqual(expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(RefcodeController.changeFlagStatus)
    );
  });
});
