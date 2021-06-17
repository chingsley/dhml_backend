/* eslint-disable jest/expect-expect */
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import RefcodeApi from './refcode.test.api';
import RefcodeController from '../../../src/modules/refcode/refcode.controllers';
import Jwt from '../../../src/utils/Jwt';
import { VALID_REF_CODE } from '../../../src/validators/joi/schemas/refcode.schema';
import _HcpService from '../hcp/hcp.test.service';
import getEnrollees from '../../../src/shared/samples/enrollee.samples';
import SampleReferalCodes from '../../../src/shared/samples/refcode.samples';
import _RefcodeService from './refcode.test.service';
import _SpecialityService from '../speciality/speciality.test.services';
require('../../../src/prototypes/array.extensions').extendArray();

describe('RefcodeController', () => {
  describe.only('createRequestForRefcodeCTRL (for existing Enrollee)', () => {
    let token, res, seededEnrollee, referringHcp, receivingHcp;
    beforeAll(async () => {
      await TestService.resetDB();
      const {
        primaryHcps: [primaryHcp],
        secondaryHcps: [secondaryHcp],
      } = await _HcpService.seedHcps({
        numPrimary: 1,
        numSecondary: 1,
      });
      referringHcp = primaryHcp;
      receivingHcp = secondaryHcp;
      const { principals } = getEnrollees({ numOfPrincipals: 1 });
      [seededEnrollee] = await TestService.seedAfrshipPrincipals(
        principals,
        primaryHcp
      );
      const speciality = await _SpecialityService.seedOne();
      const payload = SampleReferalCodes.generateSampleRefcodeRequest({
        enrolleeIdNo: seededEnrollee.enrolleeIdNo,
        specialtyId: speciality.id,
        referringHcpId: primaryHcp.id,
        receivingHcpId: secondaryHcp.id,
      });
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.SUPERADMIN
      );
      token = data.token;
      res = await RefcodeApi.requestForCode(payload, token);
    });
    it('returns status 201 on successful code generation', async (done) => {
      try {
        expect(res.status).toBe(201);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns a success message and the referal code defaults to null', async (done) => {
      try {
        const { message, data } = res.body;
        expect(message).toMatch(/successfully/i);
        expect(data.code).toBe(null);
        expect(res.status).toBe(201);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns some data about the subject enrollee', async (done) => {
      try {
        const { data } = res.body;
        expect(data.enrollee).toEqual(
          expect.objectContaining({
            enrolleeIdNo: seededEnrollee.enrolleeIdNo,
            surname: seededEnrollee.surname,
            firstName: seededEnrollee.firstName,
            middleName: seededEnrollee.middleName,
            serviceNumber: seededEnrollee.serviceNumber,
            serviceStatus: seededEnrollee.serviceStatus,
            staffNumber: seededEnrollee.staffNumber,
            scheme: seededEnrollee.scheme,
          })
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns info about the referring hcp', async (done) => {
      try {
        const { data } = res.body;
        expect(data.referringHcp).toEqual(
          expect.objectContaining({
            id: referringHcp.id,
            code: referringHcp.code,
            name: referringHcp.name,
          })
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns info about the receving hcp', async (done) => {
      try {
        const { data } = res.body;
        expect(data.receivingHcp).toEqual(
          expect.objectContaining({
            id: receivingHcp.id,
            code: receivingHcp.code,
            name: receivingHcp.name,
          })
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(RefcodeController.createRequestForRefcodeCTRL)
    );
  });
  describe.only('createRequestForRefcodeCTRL (for new Enrollee)', () => {
    let token, res, newEnrolleePayload, referringHcp, receivingHcp;
    beforeAll(async () => {
      await TestService.resetDB();
      const {
        primaryHcps: [primaryHcp],
        secondaryHcps: [secondaryHcp],
      } = await _HcpService.seedHcps({
        numPrimary: 1,
        numSecondary: 1,
      });
      referringHcp = primaryHcp;
      receivingHcp = secondaryHcp;
      const sampleEnrollees = getEnrollees({ numOfPrincipals: 1 });
      const principals = TestService.removeNullValues(
        sampleEnrollees.principals
      );
      newEnrolleePayload = {
        ...principals[0],
        scheme: 'AFRSHIP',
        enrolmentType: 'principal',
        hcpId: primaryHcp.id,
        rank: 'MAJ',
        armOfService: 'army',
        serviceNumber: 'N/12345',
      };
      const speciality = await _SpecialityService.seedOne();
      const codePayload = SampleReferalCodes.generateSampleRefcodeRequest({
        specialtyId: speciality.id,
        referringHcpId: primaryHcp.id,
        receivingHcpId: secondaryHcp.id,
      });
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.SUPERADMIN
      );
      token = data.token;
      res = await RefcodeApi.requestForCode(
        { ...newEnrolleePayload, ...codePayload },
        token
      );
    });
    it('returns status 201 on successful code generation', async (done) => {
      try {
        expect(res.status).toBe(201);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns a success message and the referal code defaults to null', async (done) => {
      try {
        const { message, data } = res.body;
        expect(message).toMatch(/successfully/i);
        expect(data.code).toBe(null);
        expect(res.status).toBe(201);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns some data about the subject enrollee', async (done) => {
      try {
        const { data } = res.body;
        expect(data.enrollee).toEqual(
          expect.objectContaining({
            surname: newEnrolleePayload.surname,
            firstName: newEnrolleePayload.firstName,
            middleName: newEnrolleePayload.middleName,
            serviceStatus: newEnrolleePayload.serviceStatus,
            scheme: newEnrolleePayload.scheme,
          })
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns info about the referring hcp', async (done) => {
      try {
        const { data } = res.body;
        expect(data.referringHcp).toEqual(
          expect.objectContaining({
            id: referringHcp.id,
            code: referringHcp.code,
            name: referringHcp.name,
          })
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns info about the receving hcp', async (done) => {
      try {
        const { data } = res.body;
        expect(data.receivingHcp).toEqual(
          expect.objectContaining({
            id: receivingHcp.id,
            code: receivingHcp.code,
            name: receivingHcp.name,
          })
        );
        done();
      } catch (e) {
        done(e);
      }
    });
  });
  describe('approveReferalCode', () => {
    let token, res;
    const responses = [];

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
          // console.log(res.body);
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
      TestService.testCatchBlock(RefcodeController.verifyReferalCode)
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
        expect(data.receivingHcpId).toEqual(destinationHcp.id);
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
        const flagReason = 'The reason for referal is not genuine';
        const payload = { flag: true, flagReason };
        const res = await RefcodeApi.changeFlagStatus(
          refcode1.id,
          payload,
          token
        );
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(data).toHaveProperty('isFlagged', payload.flag);
        expect(data).toHaveProperty('flagReason', flagReason);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('successfully approves a flagged code', async (done) => {
      try {
        await refcode2.update({ isFlagged: true });
        expect(refcode2.isFlagged).toBe(true);
        const payload = { flag: false };
        const res = await RefcodeApi.changeFlagStatus(
          refcode2.id,
          payload,
          token
        );
        await refcode2.reload();
        expect(res.status).toBe(200);
        expect(refcode2.isFlagged).toBe(payload.flag);
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
  describe('deleteRefcode', () => {
    let token, res, refcode1, refcode2;

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
      const payload = { refcodeIds: [refcode1.id, refcode2.id] };
      res = await RefcodeApi.deleteRefcode(payload, token);
    });
    it('returns status 200 on successful delete', async (done) => {
      try {
        expect(res.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns "not found" error for an attempted operation on a deleted refcodeId', async (done) => {
      try {
        const payload = { flag: false };
        const refcodeId = refcode1.id;
        const res = await RefcodeApi.changeFlagStatus(
          refcodeId,
          payload,
          token
        );
        const { errors } = res.body;
        const expectedError = `no referal code matches the id of ${refcodeId}`;
        expect(res.status).toBe(400);
        expect(errors[0]).toEqual(expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(RefcodeController.deleteRefcode)
    );
  });
  describe('getReferalCodes', () => {
    let token, seededRefcodes, res;

    beforeAll(async () => {
      await TestService.resetDB();
      const { primaryHcps, secondaryHcps } = await _HcpService.seedHcps({
        numPrimary: 2,
        numSecondary: 3,
      });
      const { sampleStaffs } = getSampleStaffs(5);
      await TestService.seedStaffs(sampleStaffs);
      const { principals, dependants } = getEnrollees({
        numOfPrincipals: 5,
        sameSchemeDepPerPrincipal: 2,
        vcshipDepPerPrincipal: 2,
      });
      const preparedPrincipals = principals.map((p, i) => {
        if (p.scheme.toUpperCase() === 'DSSHIP') {
          p.staffNumber = sampleStaffs[i].staffIdNo;
        }
        return { ...p, hcpId: primaryHcps[0].id };
      });
      const seededPrincipals = await TestService.seedEnrollees(
        preparedPrincipals
      );
      const depsWithPrincipalId = dependants.map((d) => {
        for (let p of seededPrincipals) {
          const regexPrincipalEnrolleeIdNo = new RegExp(`${p.enrolleeIdNo}-`);
          if (d.enrolleeIdNo.match(regexPrincipalEnrolleeIdNo)) {
            return {
              ...d,
              principalId: p.id,
              hcpId: p.hcpId,
            };
          }
        }
      });
      const seededDeps = await TestService.seedEnrollees(depsWithPrincipalId);

      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.SUPERADMIN
      );
      token = data.token;
      const { userId } = Jwt.decode(token);
      const refcodes = SampleReferalCodes.getTestSeed({
        enrollees: [...seededPrincipals, ...seededDeps],
        secondaryHcps,
        operatorId: userId,
      });
      seededRefcodes = await _RefcodeService.seedBulk(refcodes);
      res = await RefcodeApi.getReferalCodes('', token);
    });
    it('returns status 200 on successful fetch', async (done) => {
      try {
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(data.count).toBe(seededRefcodes.length);
        expect(data.rows).toHaveLength(seededRefcodes.length);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns the destinationHcp and the enrollee associated to each code', async (done) => {
      try {
        const { data } = res.body;
        for (let refcode of data.rows) {
          expect(refcode.receivingHcpId).toBeTruthy();
          expect(refcode.enrolleeId).toBeTruthy();
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can paginate the response', async (done) => {
      try {
        const pageSize = 5;
        const pages = Array.from(Array(seededRefcodes.length).keys());
        let fetchedCodes = [];
        for (let page of pages) {
          const res = await RefcodeApi.getReferalCodes(
            `pageSize=${pageSize}&page=${page}`,
            token
          );
          const { data } = res.body;
          expect(res.status).toBe(200);
          expect(data.count).toBe(seededRefcodes.length);
          expect(data.rows.length).toBeLessThanOrEqual(pageSize);
          for (let { id } of data.rows) {
            expect(fetchedCodes.includes(id)).toBe(false);
          }
          fetchedCodes = [
            ...fetchedCodes,
            ...data.rows.map((refcode) => refcode.code),
          ];
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can search the records', async (done) => {
      try {
        const subject = await _RefcodeService.reload(seededRefcodes[0]);
        const searchParams = {
          code: subject.code,
          enrolleeFirstName: subject.enrollee.firstName,
          enrolleeSurname: subject.enrollee.surname,
          enrolleeScheme: subject.enrollee.scheme,
          enrolleeIdNo: subject.enrollee.enrolleeIdNo,
        };
        for (let value of Object.values(searchParams)) {
          const res = await RefcodeApi.getReferalCodes(
            `searchItem=${value}`,
            token
          );
          const { data } = res.body;
          expect(data.rows.length).toBeGreaterThanOrEqual(1);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can filter the record by "isFlagged" status', async (done) => {
      try {
        await _RefcodeService.flag(
          seededRefcodes.slice(0, Math.floor(seededRefcodes.length / 2))
        );
        const searchParams = [true, false];
        for (let searchItem of searchParams) {
          const res = await RefcodeApi.getReferalCodes(
            `isFlagged=${searchItem}`,
            token
          );
          const { data } = res.body;
          for (let row of data.rows) {
            expect(row.isFlagged).toBe(searchItem);
          }
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(RefcodeController.getReferalCodes)
    );
  });
  describe('getEnrolleeCodeHistory', () => {
    let token, res1, res2;
    const numOfCodesForPrincipal1 = 6;
    const numOfCodesForPrincipal2 = 1;
    let [seededPrincipal1, seededPrincipal2] = [];

    beforeAll(async () => {
      await TestService.resetDB();
      const { primaryHcps, secondaryHcps } = await _HcpService.seedHcps({
        numPrimary: 1,
        numSecondary: 3,
      });
      const { principals } = getEnrollees({ numOfPrincipals: 2 });
      [seededPrincipal1, seededPrincipal2] = await TestService.seedEnrollees(
        principals.map((p, i) => ({
          ...p,
          hcpId: primaryHcps[0].id,
          staffNumber: null,
          serviceNumber: `SN/100${i}`,
        }))
      );
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.SUPERADMIN
      );
      token = data.token;
      const { userId } = Jwt.decode(token);
      const refcodes = SampleReferalCodes.getTestSeed({
        enrollees: [
          ...[seededPrincipal1].repreatElement(numOfCodesForPrincipal1),
          seededPrincipal2,
        ],
        secondaryHcps,
        operatorId: userId,
      });
      await _RefcodeService.seedBulk(refcodes);
      const promises = [seededPrincipal1, seededPrincipal2].map((principal) =>
        RefcodeApi.getEnrolleeCodeHistory(
          `enrolleeIdNo=${principal.enrolleeIdNo}`,
          token
        )
      );
      [res1, res2] = await Promise.all(promises);
    });
    it('returns status 200 on successfull response', async (done) => {
      try {
        expect(res1.status).toBe(200);
        expect(res2.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns all the codes generated for each principal1', async (done) => {
      try {
        const { data } = res1.body;
        expect(data.count).toEqual(numOfCodesForPrincipal1);
        expect(data.rows).toHaveLength(numOfCodesForPrincipal1);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns all the codes generated for each principal2', async (done) => {
      try {
        const { data } = res2.body;
        expect(data.count).toEqual(numOfCodesForPrincipal2);
        expect(data.rows).toHaveLength(numOfCodesForPrincipal2);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns the details of the subject enrollee', async (done) => {
      try {
        const { data: data1 } = res1.body;
        const { data: data2 } = res2.body;
        expect(data1.enrollee.id).toEqual(seededPrincipal1.id);
        expect(data2.enrollee.id).toEqual(seededPrincipal2.id);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns details of the user that generated the code', async (done) => {
      try {
        const { userId } = Jwt.decode(token);
        const refcodes = [...res1.body.data.rows, ...res2.body.data.rows];
        for (let refcode of refcodes) {
          expect(refcode.generatedBy).toHaveProperty('id', userId);
          expect(refcode.generatedBy).toHaveProperty('staffInfo');
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns error 400 if the enrolleeIdNo is not found', async (done) => {
      try {
        const nonExistingId = '111111';
        const res = await RefcodeApi.getEnrolleeCodeHistory(
          `enrolleeIdNo=${nonExistingId}`,
          token
        );
        expect(res.status).toBe(400);
        const { errors } = res.body;
        expect(errors[0]).toEqual(
          `no Enrollee matches the ID No. ${nonExistingId}`
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(RefcodeController.getEnrolleeCodeHistory)
    );
  });
});
