/* eslint-disable jest/expect-expect */
import { v2 as cloudinary } from 'cloudinary';
import faker from 'faker';

import getEnrollees from '../../../src/shared/samples/enrollee.samples';
import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import EnrolleeApi from './enrollee.test.api';
import EnrolleeMiddleware from '../../../src/modules/enrollee/enrollee.middleware';

const { log } = console;

function removeKeys(obj, fields) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (!fields.includes(key)) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

const originalImplementation = cloudinary.uploader.upload;
const SAMPLE_IMG_URL = faker.image.imageUrl();

describe('EnrolleeController', () => {
  beforeAll(() => {
    cloudinary.uploader.upload = jest
      .fn()
      .mockReturnValue({ url: SAMPLE_IMG_URL });
  });
  afterAll(() => {
    cloudinary.uploader.upload = originalImplementation;
  });
  describe('addNewEnrollee', () => {
    let sampleEnrollees,
      token,
      afrshipPrincipal,
      dsshipPrincipal,
      specialPrincipal;
    beforeAll(async () => {
      await TestService.resetDB();

      sampleEnrollees = getEnrollees({
        numOfPrincipals: 4,
        sameSchemeDepPerPrincipal: 1,
        vcshipDepPerPrincipal: 1,
      });
      const principals = TestService.removeNullValues(
        sampleEnrollees.principals
      );
      afrshipPrincipal = {
        ...principals[0],
        scheme: 'AFRSHIP',
        enrolmentType: 'principal',
        hcpId: 1,
        rank: 'MAJ',
        armOfService: 'army',
        serviceNumber: 'N/12345',
      };

      dsshipPrincipal = {
        ...principals[1],
        scheme: 'DSSHIP',
        enrolmentType: 'principal',
        hcpId: 1,
      };
      specialPrincipal = {
        ...principals[3],
        scheme: 'AFRSHIP',
        enrolmentType: 'special-principal',
        staffNumber: undefined,
        rank: 'VADM',
        armOfService: 'navy',
        serviceNumber: 'NN/1234',
        hcpId: 1,
      };
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.ENROLMENT_OFFICER
      );
      token = data.token;
    });

    it('can enrol an afrship principal while detecting unique violation of service number', async (done) => {
      try {
        const requiredFields = ['enrolmentType', 'scheme'];
        for (let field of requiredFields) {
          const res = await EnrolleeApi.enrol(
            removeKeys(afrshipPrincipal, [field]),
            token
          );
          res.status !== 400 && log(res.body);
          const { errors } = res.body;
          expect(res.status).toBe(400);
          expect(errors[0]).toMatch(new RegExp(`"${field}" is required`, 'i'));
        }

        done();
      } catch (e) {
        done(e);
      }
    });
    it('rejects service numbers when registering DSSHIP enrollees', async (done) => {
      try {
        const res = await EnrolleeApi.enrol(
          { ...dsshipPrincipal, serviceNumber: 'M0000' },
          token
        );
        res.status !== 400 && log(res.body);
        const { errors } = res.body;
        expect(res.status).toBe(400);
        expect(errors[0]).toBe('"serviceNumber" is not allowed');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('rejects enrolleeIdNo when registering a non-special princial', async (done) => {
      try {
        const res = await EnrolleeApi.enrol(
          { ...afrshipPrincipal, enrolleeIdNo: '10000' },
          token
        );
        res.status !== 400 && log(res.body);
        const { errors } = res.body;
        expect(res.status).toBe(400);
        expect(errors[0]).toBe('"enrolleeIdNo" is not allowed');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('ensures "enrolmentType" is "dependant" when registering dependant under VCSHIP', async (done) => {
      try {
        const { dependants } = sampleEnrollees;
        const res = await EnrolleeApi.enrol(
          {
            ...dependants[0],
            principalId: '000232',
            scheme: 'VCSHIP',
            enrolmentType: 'principal',
          },
          token
        );
        res.status !== 400 && log(res.body);
        const { errors } = res.body;
        expect(res.status).toBe(400);
        expect(errors[0]).toBe('"enrolmentType" must be [dependant]');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('rejects attempt to register  special princial without specifying enrolleeIdNo', async (done) => {
      try {
        const res = await EnrolleeApi.enrol(
          { ...specialPrincipal, serviceNumber: undefined },
          token
        );
        res.status !== 400 && log(res.body);
        const { errors } = res.body;
        expect(res.status).toBe(400);
        expect(errors[0]).toBe('"enrolleeIdNo" is required');
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(EnrolleeMiddleware.validateNewEnrollee)
    );
  });
});
