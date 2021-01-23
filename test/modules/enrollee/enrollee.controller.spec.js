import supertest from 'supertest';
import { v2 as cloudinary } from 'cloudinary';
import faker from 'faker';

import server from '../../../src/server';
import getEnrollees from '../../../src/shared/samples/enrollee.samples';
import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';

const app = supertest(server.server);

const originalImplementation = cloudinary.uploader.upload;
const imageFile = `${process.cwd()}/src/shared/samples/docs/img.sample.jpg`;
const SAMPLE_IMG_URL = faker.image.imageUrl();

describe('EnrolleeController', () => {
  describe('addNewEnrollee', () => {
    let sampleEnrollees, token, hcp;
    beforeAll(async () => {
      await TestService.resetDB();
      const HCPs = await TestService.seedHCPs(1);
      hcp = HCPs[0];

      sampleEnrollees = getEnrollees({
        numOfPrincipals: 1,
        sameSchemeDepPerPrincipal: 1,
        vcshipDepPerPrincipal: 1,
      });

      cloudinary.uploader.upload = jest
        .fn()
        .mockReturnValue({ url: SAMPLE_IMG_URL });
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.ENROLMENT_OFFICER
      );
      token = data.token;
    });
    afterAll(() => {
      cloudinary.uploader.upload = originalImplementation;
    });

    it('can enrol a principal', async (done) => {
      try {
        const principal = sampleEnrollees.principals[0];
        const res = await app
          .post('/api/v1/enrollees')
          .set('authorization', token)
          .field('enrolmentType', 'principal')
          .field('scheme', principal.scheme)
          .field('surname', principal.surname)
          .field('firstName', principal.firstName)
          .field('gender', principal.gender)
          .field('serviceNumber', principal.serviceNumber)
          .field('rank', principal.rank)
          .field('dateOfBirth', '2000-01-02')
          .field('identificationType', principal.identificationType)
          .field('identificationNumber', principal.identificationNumber)
          .field('serviceStatus', principal.serviceStatus)
          .field('phoneNumber', principal.phoneNumber)
          .field('email', principal.email)
          .field('residentialAddress', principal.residentialAddress)
          .field('stateOfResidence', principal.stateOfResidence)
          .field('lga', principal.lga)
          .field('bloodGroup', principal.bloodGroup)
          .field(
            'significantMedicalHistory',
            principal.significantMedicalHistory
          )
          .field('hcpId', hcp.id)
          .attach('photograph', imageFile)
          .attach('birthCertificate', imageFile)
          .attach('marriageCertificate', imageFile)
          .attach('idCard', imageFile)
          .attach('deathCertificate', imageFile)
          .attach('letterOfNok', imageFile);

        expect(res.status).toBe(201);
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
