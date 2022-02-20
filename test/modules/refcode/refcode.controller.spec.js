/* eslint-disable jest/expect-expect */
import faker from 'faker';
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
import { _random } from '../../../src/utils/helpers';
import {
  CODE_STATUS,
  SERVICE_STATUS,
} from '../../../src/shared/constants/lists.constants';
import { stateCodes } from '../../../src/shared/constants/statecodes.constants';
import { moment, months } from '../../../src/utils/timers';
import { getClaimsReqPayload, getTotalClaimsAmt } from './refcode.test.samples';
require('../../../src/prototypes/array.extensions').extendArray();

const validStates = Object.keys(stateCodes);

describe('RefcodeController', () => {
  describe('createRequestForRefcodeCTRL', () => {
    let token,
      res,
      seededEnrollee,
      referringHcp,
      receivingHcp,
      payload,
      speciality;
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
      speciality = await _SpecialityService.seedOne();
      await receivingHcp.addSpecialties([speciality.id]);
      payload = SampleReferalCodes.generateSampleRefcodeRequest({
        enrolleeIdNo: seededEnrollee.enrolleeIdNo,
        specialtyId: speciality.id,
        referringHcpId: primaryHcp.id,
        receivingHcpId: secondaryHcp.id,
      });
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(sampleStaffs[0], ROLES.MD);
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
        // console.log(res.body);
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
    it('returns 404 error if the receiving hcp does not offer the specified specialtyId', async (done) => {
      try {
        await receivingHcp.removeSpecialties([speciality.id]);
        res = await RefcodeApi.requestForCode(payload, token);
        const {
          errors: [error],
        } = res.body;
        expect(res.status).toBe(404);
        expect(error).toMatch(/does not have/i);
        done();
      } catch (e) {
        done(e);
      }
    });
    /**
     * next test case must be the last test (except test for catch block), because id deletes
     * records from the table, making such records unavailable for further tests
     */
    it('returns 404 error if the specialtyId is not found', async (done) => {
      try {
        await receivingHcp.removeSpecialties([speciality.id]);
        await _SpecialityService.deleteSpecialites([speciality.id]);
        res = await RefcodeApi.requestForCode(payload, token);
        const {
          errors: [error],
        } = res.body;
        expect(res.status).toBe(404);
        expect(error).toMatch(/No Specialty found/i);
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
  describe('getReferalCodes', () => {
    let token,
      res,
      seededEnrollees,
      referringHcps,
      receivingHcps,
      seededCodeRequests,
      operatorId;

    beforeAll(async () => {
      await TestService.resetDB();
      const { primaryHcps, secondaryHcps } = await _HcpService.seedHcps({
        numPrimary: 2,
        numSecondary: 3,
      });
      referringHcps = primaryHcps;
      receivingHcps = secondaryHcps;
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
      seededEnrollees = [...seededPrincipals, ...seededDeps];
      const sampleSpecialties = _SpecialityService.getSamples();
      const seededSpecialties = await _SpecialityService.seedBulk(
        sampleSpecialties.map((sp) => ({ ...sp, id: undefined }))
      );
      seededCodeRequests = await _RefcodeService.seedSampleCodeRequests({
        enrollees: seededEnrollees,
        specialties: seededSpecialties,
        referringHcps,
        receivingHcps,
      });
      const data = await TestService.getToken(sampleStaffs[0], ROLES.MD);
      token = data.token;
      const { userId } = Jwt.decode(token);
      operatorId = userId;
      res = await RefcodeApi.getReferalCodes('', token);
    });
    it('successfully returns all requests with status 200', async (done) => {
      try {
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(data.count).toBe(seededCodeRequests.length);
        expect(data.rows).toHaveLength(seededCodeRequests.length);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can search the data by specified fields', async (done) => {
      try {
        const searchableFields = {
          enrolleeIdNo: _random(seededEnrollees).enrolleeIdNo,
          name: _random(seededEnrollees).firstName,
          referringHcp: _random(referringHcps).name,
          receivingHcp: _random(receivingHcps).name,
          scheme: _random(seededEnrollees).scheme,
          specialty: _random(seededCodeRequests).specialty,
          diagnosis: _random(seededCodeRequests).diagnosis,
        };
        for (let [field, value] of Object.entries(searchableFields)) {
          res = await RefcodeApi.getReferalCodes(`searchItem=${value}`, token);
          const { data } = res.body;
          data.rows.map((codeRequest) => {
            expect(codeRequest[field]).toMatch(value);
          });
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can paginate the response', async (done) => {
      try {
        const pageSize = 5;
        const pages = Array.from(Array(seededCodeRequests.length).keys());
        let fetchedCodes = [];
        for (let page of pages) {
          const res = await RefcodeApi.getReferalCodes(
            `pageSize=${pageSize}&page=${page}`,
            token
          );
          const { data } = res.body;
          expect(res.status).toBe(200);
          expect(data.count).toBe(seededCodeRequests.length);
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
    it('can filter the record by "isFlagged" status', async (done) => {
      try {
        const flaggedRequests = await _RefcodeService.flagCodeRequests(
          seededCodeRequests.slice(0, 3),
          operatorId
        );
        const res = await RefcodeApi.getReferalCodes('isFlagged=true', token);
        const { data } = res.body;
        expect(data.count).toEqual(flaggedRequests.length);
        expect(data.rows).toHaveLength(flaggedRequests.length);
        data.rows.map((codeRequest) => {
          expect(codeRequest.status).toBe('FLAGGED');
          expect(codeRequest.dateFlagged).toBeTruthy();
          expect(codeRequest.flaggedById).toBe(operatorId);
        });
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
  describe('getOneRefcode (with associated claims)', () => {
    let token,
      res,
      seededEnrollees,
      referringHcps,
      receivingHcps,
      seededCodeRequests,
      refcode,
      claimsRequestPayload;

    beforeAll(async () => {
      await TestService.resetDB();
      const { primaryHcps, secondaryHcps } = await _HcpService.seedHcps({
        numPrimary: 2,
        numSecondary: 3,
      });
      referringHcps = primaryHcps;
      receivingHcps = secondaryHcps;
      const { sampleStaffs } = getSampleStaffs(5);
      await TestService.seedStaffs(sampleStaffs);
      // get auth token
      const data = await TestService.getToken(sampleStaffs[0], ROLES.MD);
      token = data.token;

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
      seededEnrollees = [...seededPrincipals, ...seededDeps];
      const sampleSpecialties = _SpecialityService.getSamples();
      const seededSpecialties = await _SpecialityService.seedBulk(
        sampleSpecialties.map((sp) => ({ ...sp, id: undefined }))
      );
      seededCodeRequests = await _RefcodeService.seedSampleCodeRequests({
        enrollees: seededEnrollees,
        specialties: seededSpecialties,
        referringHcps,
        receivingHcps,
      });
      refcode = seededCodeRequests[0];

      // approve code request to generate referal code (a prerequisite for adding claims)
      const res1 = await RefcodeApi.updateRequestStatus(
        refcode.id,
        {
          status: CODE_STATUS.APPROVED,
          stateOfGeneration: _random(validStates),
        },
        token
      );

      // reload refcode to get access to 'code' generated on approval
      refcode.reloadWithAssociations();

      // add claims to the refcode
      claimsRequestPayload = getClaimsReqPayload(res1.body.data.code);
      await RefcodeApi.addClaims(claimsRequestPayload, token);

      res = await RefcodeApi.getOneReferalCode(
        `referalCode=${refcode.code}`,
        token
      );
    });
    it('successfully returns all requests with status 200', async (done) => {
      try {
        const { data } = res.body;
        expect(res.status).toEqual(200);
        expect(data.status).toEqual(refcode.status);
        expect(data.code).toEqual(refcode.code);
        expect(data.id).toEqual(refcode.id);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns the assocated user operators', async (done) => {
      try {
        const { data } = res.body;
        ['declinedBy', 'flaggedBy', 'approvedBy', 'claimsDeclinedBy'].forEach(
          (field) => expect(field in data).toEqual(true)
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns all associated claims', async (done) => {
      try {
        const { data } = res.body;
        expect(data.claims).toHaveLength(claimsRequestPayload.claims.length);
        done();
      } catch (e) {
        done(e);
      }
    });
  });
  describe('updateCodeRequestStatus (Approve code request)', () => {
    let token,
      res,
      seededEnrollees,
      referringHcps,
      receivingHcps,
      seededCodeRequests,
      operatorId,
      payload,
      refcodeId;

    beforeAll(async () => {
      await TestService.resetDB();
      const { primaryHcps, secondaryHcps } = await _HcpService.seedHcps({
        numPrimary: 2,
        numSecondary: 3,
      });
      referringHcps = primaryHcps;
      receivingHcps = secondaryHcps;
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
      seededEnrollees = [...seededPrincipals, ...seededDeps];
      const sampleSpecialties = _SpecialityService.getSamples();
      const seededSpecialties = await _SpecialityService.seedBulk(
        sampleSpecialties.map((sp) => ({ ...sp, id: undefined }))
      );
      seededCodeRequests = await _RefcodeService.seedSampleCodeRequests({
        enrollees: seededEnrollees,
        specialties: seededSpecialties,
        referringHcps,
        receivingHcps,
      });
      const data = await TestService.getToken(sampleStaffs[0], ROLES.MD);
      token = data.token;
      const { userId } = Jwt.decode(token);
      operatorId = userId;
      refcodeId = seededCodeRequests[0].id;
      payload = {
        status: CODE_STATUS.APPROVED,
        stateOfGeneration: _random(validStates),
      };
      res = await RefcodeApi.updateRequestStatus(refcodeId, payload, token);
    });
    it('it returns status 200 on successful approval', async (done) => {
      try {
        expect(res.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('sets the dateApproved to today"s date', async (done) => {
      try {
        const { data } = res.body;
        const todaysDate = moment().format('DDMMYY');
        const dateApproved = moment(data.dateApproved).format('DDMMYY');
        expect(dateApproved).toEqual(todaysDate);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('saves the id of the user that approved the code', async (done) => {
      try {
        const { data } = res.body;
        expect(data.approvedById).toBe(operatorId);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('generates a valid code for the request', async (done) => {
      try {
        const { data } = res.body;
        expect(data.code).toMatch(VALID_REF_CODE);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('ensures the generated code has the correct state code', async (done) => {
      try {
        const { data } = res.body;
        const inputStateCode =
          stateCodes[payload.stateOfGeneration.toLowerCase()];
        const outputStateCode = data.code
          .match(/^[A-Z]{2,3}\//)[0]
          .match(/[A-Z]{2,3}/)[0];
        expect(inputStateCode).toEqual(outputStateCode);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('encodes the todays date in the referal code', async (done) => {
      try {
        const { data } = res.body;
        const todaysDate = moment().format('DDMMYY');
        const dateInCode = data.code.match(/\d{6}/)[0];
        expect(todaysDate).toBe(dateInCode);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('encodes the correct specialty code', async (done) => {
      try {
        const { data } = res.body;
        const encodedSpecialtyCode = data.code.match(/(\d)+[A-Z]/)[0];
        const specialty = await _SpecialityService.findOneWhere({
          id: data.specialtyId,
        });
        expect(encodedSpecialtyCode).toBe(specialty.code);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns associated models', async (done) => {
      try {
        const { data } = res.body;
        expect(data).toHaveProperty('enrollee');
        expect(data).toHaveProperty('specialty');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('genrates "incremented" referal code for same specialty requests approved in same day', async (done) => {
      try {
        const refcodeId = seededCodeRequests[1].id;
        await seededCodeRequests[1].update({
          specialtyId: seededCodeRequests[0].specialtyId,
        });
        res = await RefcodeApi.updateRequestStatus(refcodeId, payload, token);
        const { data } = res.body;
        const count = data.code.match(/-\d+\//)[0].match(/\d+/)[0];
        expect(Number(count)).toEqual(2);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('encodes "S" in the code for serving enrollees', async (done) => {
      try {
        const afrshipEnrollee = seededEnrollees.find(
          (enrollee) => enrollee.scheme.toLowerCase() === 'afrship'
        );
        const originalServiceStatus = afrshipEnrollee.serviceStatus;
        await afrshipEnrollee.update({ serviceStatus: SERVICE_STATUS.SERVING });
        const refcode = seededCodeRequests.find(
          (refcode) => refcode.enrolleeId === afrshipEnrollee.id
        );
        await _RefcodeService.resetAllStatusUpdate(refcode.id);
        res = await RefcodeApi.updateRequestStatus(refcode.id, payload, token);
        const { data } = res.body;
        const encodedServiceCode = data.code
          .match(/\/[A-Z]{1,2}/)[0]
          .match(/[A-Z]{1,2}/)[0];
        expect(encodedServiceCode).toBe('S');
        await afrshipEnrollee.update({ serviceStatus: originalServiceStatus });
        done();
      } catch (e) {
        done(e);
      }
    });
    it('encodes "AD" in the code for non-afrship enrollees', async (done) => {
      try {
        const enrollee = seededEnrollees.find(
          (enrollee) => enrollee.scheme.toLowerCase() !== 'afrship'
        );
        const originalServiceStatus = enrollee.serviceStatus;
        await enrollee.update({ serviceStatus: null });
        const refcode = seededCodeRequests.find(
          (refcode) => refcode.enrolleeId === enrollee.id
        );
        await _RefcodeService.resetAllStatusUpdate(refcode.id);
        res = await RefcodeApi.updateRequestStatus(refcode.id, payload, token);
        const { data } = res.body;
        const encodedServiceCode = data.code
          .match(/\/[A-Z]{1,2}/)[0]
          .match(/[A-Z]{1,2}/)[0];
        expect(encodedServiceCode).toBe('AD');
        await enrollee.update({ serviceStatus: originalServiceStatus });
        done();
      } catch (e) {
        done(e);
      }
    });
    it('encodes "R" in the code for retired enrollees', async (done) => {
      try {
        const afrshipEnrollee = seededEnrollees.find(
          (enrollee) => enrollee.scheme.toLowerCase() === 'afrship'
        );
        const originalServiceStatus = afrshipEnrollee.serviceStatus;
        await afrshipEnrollee.update({ serviceStatus: SERVICE_STATUS.RETIRED });
        const refcode = seededCodeRequests.find(
          (refcode) => refcode.enrolleeId === afrshipEnrollee.id
        );
        await _RefcodeService.resetAllStatusUpdate(refcode.id);
        res = await RefcodeApi.updateRequestStatus(refcode.id, payload, token);
        const { data } = res.body;
        const encodedServiceCode = data.code
          .match(/\/[A-Z]{1,2}/)[0]
          .match(/[A-Z]{1,2}/)[0];
        expect(encodedServiceCode).toBe('R');
        await afrshipEnrollee.update({ serviceStatus: originalServiceStatus });
        done();
      } catch (e) {
        done(e);
      }
    });
    it('will not approve an expired code', async (done) => {
      try {
        const { APPROVED } = CODE_STATUS;
        const stateOfGeneration = _random(validStates);
        const payload = { status: APPROVED, stateOfGeneration };
        const refcode = seededCodeRequests[1];
        await _RefcodeService.resetAllStatusUpdate(refcode.id);
        await refcode.update({ expiresAt: months.setPast(2) });
        const res = await RefcodeApi.updateRequestStatus(
          refcode.id,
          payload,
          token
        );
        const {
          errors: [error],
        } = res.body;
        const expectedError = 'Action not allowed because the code has expired';
        expect(res.status).toBe(403);
        expect(error).toBe(expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('will not approve a "claimed" code', async (done) => {
      try {
        const { APPROVED } = CODE_STATUS;
        const stateOfGeneration = _random(validStates);
        const payload = { status: APPROVED, stateOfGeneration };
        const refcode = seededCodeRequests[1];
        await _RefcodeService.resetAllStatusUpdate(refcode.id);
        await refcode.update({ claimsVerifiedOn: months.setPast(2) });
        const res = await RefcodeApi.updateRequestStatus(
          refcode.id,
          payload,
          token
        );
        const {
          errors: [error],
        } = res.body;
        const expectedError =
          'Action not allowed because the code has verified claims';
        expect(res.status).toBe(403);
        expect(error).toBe(expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('will not approve an already "declined" code', async (done) => {
      try {
        const { APPROVED } = CODE_STATUS;
        const stateOfGeneration = _random(validStates);
        const payload = { status: APPROVED, stateOfGeneration };
        const refcode = seededCodeRequests[1];
        await _RefcodeService.resetAllStatusUpdate(refcode.id);
        await refcode.update({ dateDeclined: months.setPast(2) });
        const res = await RefcodeApi.updateRequestStatus(
          refcode.id,
          payload,
          token
        );
        const {
          errors: [error],
        } = res.body;
        const expectedError =
          'Action not allowed because the code has already been declined';
        expect(res.status).toBe(403);
        expect(error).toBe(expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(RefcodeController.updateCodeRequestStatus)
    );
  });
  describe('updateCodeRequestStatus (Flagging a code request)', () => {
    let token,
      res,
      seededEnrollees,
      referringHcps,
      receivingHcps,
      seededCodeRequests,
      operatorId,
      payload,
      refcodeId;

    beforeAll(async () => {
      await TestService.resetDB();
      const { primaryHcps, secondaryHcps } = await _HcpService.seedHcps({
        numPrimary: 2,
        numSecondary: 3,
      });
      referringHcps = primaryHcps;
      receivingHcps = secondaryHcps;
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
      seededEnrollees = [...seededPrincipals, ...seededDeps];
      const sampleSpecialties = _SpecialityService.getSamples();
      const seededSpecialties = await _SpecialityService.seedBulk(
        sampleSpecialties.map((sp) => ({ ...sp, id: undefined }))
      );
      seededCodeRequests = await _RefcodeService.seedSampleCodeRequests({
        enrollees: seededEnrollees,
        specialties: seededSpecialties,
        referringHcps,
        receivingHcps,
      });
      const data = await TestService.getToken(sampleStaffs[0], ROLES.MD);
      token = data.token;
      const { userId } = Jwt.decode(token);
      operatorId = userId;
      refcodeId = seededCodeRequests[0].id;
      payload = {
        status: CODE_STATUS.FLAGGED,
        flagReason: faker.lorem.text(),
      };
      res = await RefcodeApi.updateRequestStatus(refcodeId, payload, token);
    });
    it('returns status 200 on successful request', async (done) => {
      try {
        expect(res.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('marks the correct refcode request as FLAGGED', async (done) => {
      try {
        const { data } = res.body;
        expect(data.id).toBe(refcodeId);
        expect(data.status).toBe(CODE_STATUS.FLAGGED);
        expect(data.flagReason).toMatch(payload.flagReason);
        expect(data.dateApproved).toBe(null);
        expect(data.dateDeclined).toBe(null);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('correctly records the dateFlaged as current date', async (done) => {
      try {
        const { data } = res.body;
        const todaysDate = moment().format('DDMMYY');
        const dateFlagged = moment(data.dateFlagged).format('DDMMYY');
        expect(dateFlagged).toEqual(todaysDate);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('saves the id of the user that flagged the code', async (done) => {
      try {
        const { data } = res.body;
        expect(data.flaggedById).toBe(operatorId);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can flag a previously approved code without changing the code or the expiry date', async (done) => {
      try {
        const { APPROVED, FLAGGED } = CODE_STATUS;
        const stateOfGeneration = _random(validStates);
        const flagReason = faker.lorem.text();
        const payload1 = { status: APPROVED, stateOfGeneration };
        const payload2 = { status: FLAGGED, flagReason };
        const refcodeId = seededCodeRequests[1].id;
        const res1 = await RefcodeApi.updateRequestStatus(
          refcodeId,
          payload1,
          token
        );
        const res2 = await RefcodeApi.updateRequestStatus(
          refcodeId,
          payload2,
          token
        );
        const { data: data1 } = res1.body;
        const { data: data2 } = res2.body;
        expect(data1.status).toBe(APPROVED);
        expect(data2.status).toBe(FLAGGED);
        expect(data1.code).toEqual(data2.code);
        expect(data1.expiresAt).toEqual(data2.expiresAt);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('will not flag an expired code', async (done) => {
      try {
        const { FLAGGED } = CODE_STATUS;
        const flagReason = faker.lorem.text();
        const payload = { status: FLAGGED, flagReason };
        const refcode = seededCodeRequests[1];
        await _RefcodeService.resetAllStatusUpdate(refcode.id);
        await refcode.update({ expiresAt: months.setPast(2) });
        const res = await RefcodeApi.updateRequestStatus(
          refcode.id,
          payload,
          token
        );
        const {
          errors: [error],
        } = res.body;
        const expectedError = 'Action not allowed because the code has expired';
        expect(res.status).toBe(403);
        expect(error).toBe(expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('will not flag a "claimed" code', async (done) => {
      try {
        const { FLAGGED } = CODE_STATUS;
        const flagReason = faker.lorem.text();
        const payload = { status: FLAGGED, flagReason };
        const refcode = seededCodeRequests[1];
        await _RefcodeService.resetAllStatusUpdate(refcode.id);
        await refcode.update({ claimsVerifiedOn: months.setPast(2) });
        const res = await RefcodeApi.updateRequestStatus(
          refcode.id,
          payload,
          token
        );
        const {
          errors: [error],
        } = res.body;
        const expectedError =
          'Action not allowed because the code has verified claims';
        expect(res.status).toBe(403);
        expect(error).toBe(expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('will not flag an already "declined" code', async (done) => {
      try {
        const { FLAGGED } = CODE_STATUS;
        const flagReason = faker.lorem.text();
        const payload = { status: FLAGGED, flagReason };
        const refcode = seededCodeRequests[1];
        await _RefcodeService.resetAllStatusUpdate(refcode.id);
        await refcode.update({ dateDeclined: months.setPast(2) });
        const res = await RefcodeApi.updateRequestStatus(
          refcode.id,
          payload,
          token
        );
        const {
          errors: [error],
        } = res.body;
        const expectedError =
          'Action not allowed because the code has already been declined';
        expect(res.status).toBe(403);
        expect(error).toBe(expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });
  });
  describe('updateCodeRequestStatus (Decline a code request)', () => {
    let token,
      res,
      seededEnrollees,
      referringHcps,
      receivingHcps,
      seededCodeRequests,
      operatorId,
      payload,
      refcodeId;

    beforeAll(async () => {
      await TestService.resetDB();
      const { primaryHcps, secondaryHcps } = await _HcpService.seedHcps({
        numPrimary: 2,
        numSecondary: 3,
      });
      referringHcps = primaryHcps;
      receivingHcps = secondaryHcps;
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
      seededEnrollees = [...seededPrincipals, ...seededDeps];
      const sampleSpecialties = _SpecialityService.getSamples();
      const seededSpecialties = await _SpecialityService.seedBulk(
        sampleSpecialties.map((sp) => ({ ...sp, id: undefined }))
      );
      seededCodeRequests = await _RefcodeService.seedSampleCodeRequests({
        enrollees: seededEnrollees,
        specialties: seededSpecialties,
        referringHcps,
        receivingHcps,
      });
      const data = await TestService.getToken(sampleStaffs[0], ROLES.MD);
      token = data.token;
      const { userId } = Jwt.decode(token);
      operatorId = userId;
      refcodeId = seededCodeRequests[0].id;
      payload = {
        status: CODE_STATUS.DECLINED,
        declineReason: faker.lorem.text(),
      };
      res = await RefcodeApi.updateRequestStatus(refcodeId, payload, token);
    });
    it('returns status 200 on successful request', async (done) => {
      try {
        expect(res.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('marks the correct refcode request as DECLINED', async (done) => {
      try {
        const { data } = res.body;
        expect(data.id).toBe(refcodeId);
        expect(data.status).toBe(CODE_STATUS.DECLINED);
        expect(data.declineReason).toMatch(payload.declineReason);
        expect(data.dateApproved).toBe(null);
        expect(data.dateFlagged).toBe(null);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('correctly records the dateDeclined as current date', async (done) => {
      try {
        const { data } = res.body;
        const todaysDate = moment().format('DDMMYY');
        const dateDeclined = moment(data.dateDeclined).format('DDMMYY');
        expect(dateDeclined).toEqual(todaysDate);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('saves the id of the user that declined the code', async (done) => {
      try {
        const { data } = res.body;
        expect(data.declinedById).toBe(operatorId);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can decline a previously approved code without changing the code or the expiry date', async (done) => {
      try {
        const { APPROVED, DECLINED } = CODE_STATUS;
        const stateOfGeneration = _random(validStates);
        const declineReason = faker.lorem.text();
        const payload1 = { status: APPROVED, stateOfGeneration };
        const payload2 = { status: DECLINED, declineReason };
        const refcodeId = seededCodeRequests[1].id;
        const res1 = await RefcodeApi.updateRequestStatus(
          refcodeId,
          payload1,
          token
        );
        const res2 = await RefcodeApi.updateRequestStatus(
          refcodeId,
          payload2,
          token
        );
        const { data: data1 } = res1.body;
        const { data: data2 } = res2.body;
        expect(data1.status).toBe(APPROVED);
        expect(data2.status).toBe(DECLINED);
        expect(data1.code).toEqual(data2.code);
        expect(data1.expiresAt).toEqual(data2.expiresAt);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('will not decline an expired code', async (done) => {
      try {
        const { DECLINED } = CODE_STATUS;
        const declineReason = faker.lorem.text();
        const payload = { status: DECLINED, declineReason };
        const refcode = seededCodeRequests[1];
        await _RefcodeService.resetAllStatusUpdate(refcode.id);
        await refcode.update({ expiresAt: months.setPast(2) });
        const res = await RefcodeApi.updateRequestStatus(
          refcode.id,
          payload,
          token
        );
        const {
          errors: [error],
        } = res.body;
        const expectedError = 'Action not allowed because the code has expired';
        expect(res.status).toBe(403);
        expect(error).toBe(expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('will not decline a "claimed" code', async (done) => {
      try {
        const { DECLINED } = CODE_STATUS;
        const declineReason = faker.lorem.text();
        const payload = { status: DECLINED, declineReason };
        const refcode = seededCodeRequests[1];
        await _RefcodeService.resetAllStatusUpdate(refcode.id);
        await refcode.update({ claimsVerifiedOn: months.setPast(2) });
        const res = await RefcodeApi.updateRequestStatus(
          refcode.id,
          payload,
          token
        );
        const {
          errors: [error],
        } = res.body;
        const expectedError =
          'Action not allowed because the code has verified claims';
        expect(res.status).toBe(403);
        expect(error).toBe(expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('will not decline an already "declined" code', async (done) => {
      try {
        const { DECLINED } = CODE_STATUS;
        const declineReason = faker.lorem.text();
        const payload = { status: DECLINED, declineReason };
        const refcode = seededCodeRequests[1];
        await _RefcodeService.resetAllStatusUpdate(refcode.id);
        await refcode.update({ dateDeclined: months.setPast(2) });
        const res = await RefcodeApi.updateRequestStatus(
          refcode.id,
          payload,
          token
        );
        const {
          errors: [error],
        } = res.body;
        const expectedError =
          'Action not allowed because the code has already been declined';
        expect(res.status).toBe(403);
        expect(error).toBe(expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });
  });
  describe('updateCodeRequestStatus (Decline a claims associated with code)', () => {
    let token,
      seededEnrollees,
      referringHcps,
      receivingHcps,
      seededCodeRequests,
      operatorId,
      refcode;

    beforeAll(async () => {
      await TestService.resetDB();
      const { primaryHcps, secondaryHcps } = await _HcpService.seedHcps({
        numPrimary: 2,
        numSecondary: 3,
      });
      referringHcps = primaryHcps;
      receivingHcps = secondaryHcps;
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
      seededEnrollees = [...seededPrincipals, ...seededDeps];
      const sampleSpecialties = _SpecialityService.getSamples();
      const seededSpecialties = await _SpecialityService.seedBulk(
        sampleSpecialties.map((sp) => ({ ...sp, id: undefined }))
      );
      seededCodeRequests = await _RefcodeService.seedSampleCodeRequests({
        enrollees: seededEnrollees,
        specialties: seededSpecialties,
        referringHcps,
        receivingHcps,
      });
      const data = await TestService.getToken(sampleStaffs[0], ROLES.MD);
      token = data.token;
      const { userId } = Jwt.decode(token);
      operatorId = userId;
      refcode = seededCodeRequests[0];
      // refcodeId = seededCodeRequests[0].id;
    });
    it('will fail if the status is "claimsDelcineReason" is not provided', async (done) => {
      const payload = {
        status: CODE_STATUS.CLAIMS_DECLINED,
        // claimsDeclineReason: faker.lorem.text(),
      };
      try {
        const res = await RefcodeApi.updateRequestStatus(
          refcode.id,
          payload,
          token
        );
        const { errors } = res.body;
        const expectedErr = '"claimsDeclineReason" is required';
        expect(errors[0]).toBe(expectedErr);
        expect(res.status).toBe(400);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('will fail if no claims exist for the refcode', async (done) => {
      const payload = {
        status: CODE_STATUS.CLAIMS_DECLINED,
        claimsDeclineReason: faker.lorem.text(),
      };
      try {
        const res = await RefcodeApi.updateRequestStatus(
          refcode.id,
          payload,
          token
        );
        const { errors } = res.body;
        const expectedErr = 'No Claims found for the referal code';
        expect(errors[0]).toBe(expectedErr);
        expect(res.status).toBe(403);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can successfully decline the claims', async (done) => {
      try {
        // reset all prev status updates on refcode due to preceeding tests
        await _RefcodeService.resetAllStatusUpdate(refcode.id);

        // approve code request to generate referal code ( a prerequisite for adding claims)
        const res1 = await RefcodeApi.updateRequestStatus(
          refcode.id,
          {
            status: CODE_STATUS.APPROVED,
            stateOfGeneration: _random(validStates),
          },
          token
        );

        // add claims to the refcode
        const claimsRequestPayload = getClaimsReqPayload(res1.body.data.code);
        await RefcodeApi.addClaims(claimsRequestPayload, token);

        // then decline claims
        const payload = {
          status: CODE_STATUS.CLAIMS_DECLINED,
          claimsDeclineReason: faker.lorem.text(),
        };
        const res2 = await RefcodeApi.updateRequestStatus(
          refcode.id,
          payload,
          token
        );
        const data = res2.body.data;
        // --- check response body --- //
        // returns the id of the refcode:
        expect(data.id).toBe(refcode.id);
        // does not affect the status field of the refcode:
        expect(data.status).toBe(CODE_STATUS.APPROVED);
        // records the id of the user that declined the claims
        expect(data.claimsDeclineById).toEqual(operatorId);
        // returns the claimsDeclineReason
        expect(data.claimsDeclineReason).toMatch(payload.claimsDeclineReason);
        // sets the claimsDeclineDate as current day
        const todaysDate = moment().format('DDMMYY');
        expect(moment(data.claimsDeclineDate).format('DDMMYY')).toEqual(
          todaysDate
        );

        // --- check database changes -- //
        await refcode.reloadWithAssociations();
        // does not affect the status field of the refcode:
        expect(refcode.status).toBe(CODE_STATUS.APPROVED);
        // records the id of the user that declined the claims
        expect(refcode.claimsDeclineById).toEqual(operatorId);
        // returns the claimsDeclineReason
        expect(refcode.claimsDeclineReason).toMatch(
          payload.claimsDeclineReason
        );
        // sets the claimsDeclineDate as current day
        expect(moment(refcode.claimsDeclineDate).format('DDMMYY')).toEqual(
          todaysDate
        );

        // returns fields that indicates claims were declined... in route /refcodes/get-one
        const res3 = await RefcodeApi.getOneReferalCode(
          `refcodeId=${refcode.id}`,
          token
        );
        const data3 = res3.body.data;
        expect(data3.claimsDeclineById).toEqual(operatorId);
        expect(data3.claimsDeclinedBy).toHaveProperty('id', operatorId);
        expect(data3.claimsDeclineReason).toBe(payload.claimsDeclineReason);
        expect(moment(data3.claimsDeclineDate).format('DDMMYY')).toEqual(
          todaysDate
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can successfully UNDO claims decline', async (done) => {
      try {
        // reset all prev status updates on refcode due to preceeding tests
        await _RefcodeService.resetAllStatusUpdate(refcode.id);

        // approve code request to generate referal code
        const res1 = await RefcodeApi.updateRequestStatus(
          refcode.id,
          {
            status: CODE_STATUS.APPROVED,
            stateOfGeneration: _random(validStates),
          },
          token
        );

        // add claims to the refcode
        const claimsRequestPayload = getClaimsReqPayload(res1.body.data.code);
        await RefcodeApi.addClaims(claimsRequestPayload, token);

        // then decline claims
        const payload = {
          status: CODE_STATUS.CLAIMS_DECLINED,
          claimsDeclineReason: faker.lorem.text(),
        };
        await RefcodeApi.updateRequestStatus(refcode.id, payload, token);
        // --- check database changes after claims decline-- //
        await refcode.reloadWithAssociations();
        // does not affect the status field of the refcode:
        expect(refcode.status).toBe(CODE_STATUS.APPROVED);
        // records the id of the user that declined the claims
        expect(refcode.claimsDeclineById).toEqual(operatorId);
        // returns the claimsDeclineReason
        expect(refcode.claimsDeclineReason).toMatch(
          payload.claimsDeclineReason
        );
        // sets the claimsDeclineDate as current day
        const todaysDate = moment().format('DDMMYY');
        expect(moment(refcode.claimsDeclineDate).format('DDMMYY')).toEqual(
          todaysDate
        );

        // unod the claims decline
        await RefcodeApi.updateRequestStatus(
          refcode.id,
          { status: CODE_STATUS.CLAIMS_NOT_DECLINED },
          token
        );

        // --- check database changes after 'UNDO claims decline' -- //
        await refcode.reloadWithAssociations();
        // it will not change the status field of the refcode:
        expect(refcode.status).toBe(CODE_STATUS.APPROVED);
        // it sets the claimsDeclineById to null:
        expect(refcode.claimsDeclineById).toEqual(null);
        // it sets the claimsDeclineReason to null:
        expect(refcode.claimsDeclineReason).toEqual(null);
        // it sets the claimsDeclineDate to null:
        expect(refcode.claimsDeclineDate).toEqual(null);

        // returns fields that indicates claims were declined... in route /refcodes/get-one
        const res3 = await RefcodeApi.getOneReferalCode(
          `refcodeId=${refcode.id}`,
          token
        );
        const data3 = res3.body.data;
        expect(data3.claimsDeclineById).toBe(null);
        expect(data3.claimsDeclinedBy).toBe(null);
        expect(data3.claimsDeclineReason).toBe(null);
        expect(data3.claimsDeclineDate).toBe(null);
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});

describe('ClaimsController (Tested in the test Refcode Module', () => {
  describe('getClaims', () => {
    let token,
      seededEnrollees,
      referringHcps,
      receivingHcps,
      seededCodeRequests,
      operatorId,
      refcode;

    beforeAll(async () => {
      await TestService.resetDB();
      const { primaryHcps, secondaryHcps } = await _HcpService.seedHcps({
        numPrimary: 2,
        numSecondary: 3,
      });
      referringHcps = primaryHcps;
      receivingHcps = secondaryHcps;
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
      seededEnrollees = [...seededPrincipals, ...seededDeps];
      const sampleSpecialties = _SpecialityService.getSamples();
      const seededSpecialties = await _SpecialityService.seedBulk(
        sampleSpecialties.map((sp) => ({ ...sp, id: undefined }))
      );
      seededCodeRequests = await _RefcodeService.seedSampleCodeRequests({
        enrollees: seededEnrollees,
        specialties: seededSpecialties,
        referringHcps,
        receivingHcps,
      });
      const data = await TestService.getToken(sampleStaffs[0], ROLES.MD);
      token = data.token;
      const { userId } = Jwt.decode(token);
      operatorId = userId;
      refcode = seededCodeRequests[0];
      // refcodeId = seededCodeRequests[0].id;
    });
    it('returns refcode with claims related fields', async (done) => {
      try {
        // reset all prev status updates on refcode due to preceeding tests
        await _RefcodeService.resetAllStatusUpdate(refcode.id);

        // approve code request to generate referal code
        const res1 = await RefcodeApi.updateRequestStatus(
          refcode.id,
          {
            status: CODE_STATUS.APPROVED,
            stateOfGeneration: _random(validStates),
          },
          token
        );

        // add claims to the refcode
        const claimsRequestPayload = getClaimsReqPayload(res1.body.data.code);
        await RefcodeApi.addClaims(claimsRequestPayload, token);

        await refcode.reloadWithAssociations();

        const res2 = await RefcodeApi.getClaims(token);
        const response = res2.body.data.rows[0];
        expect(res2.status).toEqual(200);
        expect(response.id).toEqual(refcode.id);
        expect(response.code).toEqual(refcode.code);
        const totalClaimsAmt = getTotalClaimsAmt(claimsRequestPayload.claims);
        expect(Number(response.amount)).toEqual(totalClaimsAmt);
        expect(response.claimsVerifiedOn).toBe(null);
        expect(response.claimsDeclineDate).toBe(null);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it returns claimsDeclineDate for a refcode with declined claims', async (done) => {
      try {
        // delete all added claims due to preceeding tests
        await TestService.resetDB(['Claim']);

        // reset all prev status updates on refcode due to preceeding tests
        await _RefcodeService.resetAllStatusUpdate(refcode.id);

        // approve code request to generate referal code (a prerequisite for adding claims)
        const res1 = await RefcodeApi.updateRequestStatus(
          refcode.id,
          {
            status: CODE_STATUS.APPROVED,
            stateOfGeneration: _random(validStates),
          },
          token
        );

        // add claims to the refcode
        const claimsRequestPayload = getClaimsReqPayload(res1.body.data.code);
        await RefcodeApi.addClaims(claimsRequestPayload, token);

        // then decline claims
        await RefcodeApi.updateRequestStatus(
          refcode.id,
          {
            status: CODE_STATUS.CLAIMS_DECLINED,
            claimsDeclineReason: faker.lorem.text(),
          },
          token
        );

        await refcode.reloadWithAssociations();

        const res2 = await RefcodeApi.getClaims(token);
        const response = res2.body.data.rows[0];
        expect(res2.status).toEqual(200);
        expect(response.id).toEqual(refcode.id);
        expect(response.code).toEqual(refcode.code);
        const totalClaimsAmt = getTotalClaimsAmt(claimsRequestPayload.claims);
        expect(Number(response.amount)).toEqual(totalClaimsAmt);
        expect(response.claimsVerifiedOn).toBe(null);
        expect(response.claimsDeclineDate).not.toBe(null);
        const todaysDate = moment().format('DDMMYY');
        expect(moment(response.claimsDeclineDate).format('DDMMYY')).toEqual(
          todaysDate
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it returns claimsVerifiedOn date for a refcode with verified claims', async (done) => {
      try {
        // delete all added claims due to preceeding tests
        await TestService.resetDB(['Claim']);

        // reset all prev status updates on refcode due to preceeding tests
        await _RefcodeService.resetAllStatusUpdate(refcode.id);

        // approve code request to generate referal code (a prerequisite for adding claims)
        const res1 = await RefcodeApi.updateRequestStatus(
          refcode.id,
          {
            status: CODE_STATUS.APPROVED,
            stateOfGeneration: _random(validStates),
          },
          token
        );

        // add claims to the refcode
        const claimsRequestPayload = getClaimsReqPayload(res1.body.data.code);
        await RefcodeApi.addClaims(claimsRequestPayload, token);

        // then verify claims
        const remarks = faker.lorem.text();
        const res2 = await RefcodeApi.verifyClaims(
          { refcodeId: refcode.id, remarks },
          token
        );
        expect(res2.status).toBe(200);

        await refcode.reloadWithAssociations();

        // const res2 = await RefcodeApi.getClaims(token);
        const data = res2.body.data;
        expect(data.remarksOnClaims).toEqual(remarks);
        expect(data.claimsVerifierId).toEqual(operatorId);
        const todaysDate = moment().format('DDMMYY');
        expect(moment(data.claimsVerifiedOn).format('DDMMYY')).toEqual(
          todaysDate
        );
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
