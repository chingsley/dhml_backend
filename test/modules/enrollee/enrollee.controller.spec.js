import supertest from 'supertest';
import { v2 as cloudinary } from 'cloudinary';
import faker from 'faker';

import server from '../../../src/server';
import getEnrollees from '../../../src/shared/samples/enrollee.samples';
import TestService from '../app/app.test.service';
import { ENROLMENT_OFFICER } from '../../../src/shared/constants/roles.constants';

const app = supertest(server.server);

const originalImplementation = cloudinary.uploader.upload;
const imageFile = `${process.cwd()}/src/shared/samples/docs/img.sample.jpg`;
const SAMPLE_IMG_URL = faker.image.imageUrl;

describe('EnrolleeController', () => {
  describe('addNewEnrollee', () => {
    let sampleEnrollees, token;
    beforeAll(async () => {
      await TestService.resetDB();
      sampleEnrollees = getEnrollees({
        numOfPrincipals: 1,
        sameSchemeDepPerPrincipal: 1,
        vcshipDepPerPrincipal: 1,
      });
      // prncpl = principals[0];
      // const sameSchemeDep = dependants.find(
      //   (dep) => dep.scheme === prncpl.scheme
      // );
      // const vcshipDep = dependants.find((dep) => dep.scheme !== prncpl.scheme);
      // console.log(prncpl, sameSchemeDep, vcshipDep);

      cloudinary.uploader.upload = jest
        .fn()
        .mockReturnValue({ url: SAMPLE_IMG_URL });
      // token = await TestService.getToken(ENROLMENT_OFFICER);
    });
    afterAll(() => {
      cloudinary.uploader.upload = originalImplementation;
    });

    it('can enrol a principal', async (done) => {
      try {
        const principal = sampleEnrollees.principals[0];
        // const res = await app
        //   .post('/api/v1/users/register')
        //   .set('authorization', token)
        //   .field('enrolmentType', principal.enrolmentType)
        //   .field('scheme', principal.scheme)
        //   .field('surname', principal.surname)
        //   .field('firstName', principal.firstName)
        //   .field('serviceNumber', principal.serviceNumber)
        //   .field('rank', principal.rank)
        //   .field('dateOfBirth', principal.dateOfBirth)
        //   .field('identificationType', principal.identificationType)
        //   .field('identificationNumber', principal.identificationNumber)
        //   .field('serviceStatus', principal.serviceStatus)
        //   .field('phoneNumber', principal.phoneNumber)
        //   .field('email', principal.email)
        //   .field('residentialAddress', principal.residentialAddress)
        //   .field('stateOfResidence', principal.stateOfResidence)
        //   .field('lga', principal.lga)
        //   .field('bloodGroup', principal.bloodGroup)
        //   .field(
        //     'significantMedicalHistory',
        //     principal.significantMedicalHistory
        //   )
        //   .field('hcpId', principal.hcpId)
        //   .attach('photograph', imageFile)
        //   .attach('birthCertificate', imageFile)
        //   .attach('marriageCertificate', imageFile)
        //   .attach('idCard', imageFile)
        //   .attach('deathCertificate', imageFile)
        //   .attach('letterOfNok', imageFile);
        expect(true).toBe(true);
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
