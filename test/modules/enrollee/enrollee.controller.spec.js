import supertest from 'supertest';
import { v2 as cloudinary } from 'cloudinary';
import faker from 'faker';

import server from '../../../src/server';
import getEnrollees from '../../../src/shared/samples/enrollee.samples';
import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';

const { log } = console;

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
        numOfPrincipals: 2,
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
        const { principals } = sampleEnrollees;
        const principal = principals[0];
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
        // res.status !== 201 && log(res.body);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('data');
        const { data } = res.body;
        expect(data).toEqual(
          expect.objectContaining({
            id: '00231',
            isPrincipal: true,
            scheme: principal.scheme,
          })
        );
        done();
      } catch (e) {
        done(e);
      }
    });

    it('can enrol a dependant', async (done) => {
      try {
        const { principals, dependants } = sampleEnrollees;
        const principal = principals[0];
        const dependant = dependants[0];
        const res = await app
          .post('/api/v1/enrollees')
          .set('authorization', token)
          .field('hcpId', hcp.id)
          .field('enrolmentType', 'dependant')
          .field('principalId', principal.id)
          .field('scheme', dependant.scheme)
          .field('surname', dependant.surname)
          .field('firstName', dependant.firstName)
          .field('gender', dependant.gender)
          .field('dateOfBirth', '2000-01-02')
          .field('phoneNumber', dependant.phoneNumber)
          .field('email', dependant.email)
          .field('residentialAddress', principal.residentialAddress)
          .field('stateOfResidence', dependant.stateOfResidence)
          .field('lga', dependant.lga)
          .field('bloodGroup', dependant.bloodGroup)
          .field('relationshipToPrincipal', dependant.relationshipToPrincipal)
          .field(
            'significantMedicalHistory',
            dependant.significantMedicalHistory
          );
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('data');
        const { data } = res.body;
        expect(data).toEqual(
          expect.objectContaining({
            id: dependant.id,
            isDependant: true,
            scheme: dependant.scheme,
          })
        );
        expect(true).toBe(true);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can enrol a special principal', async (done) => {
      try {
        const { principals } = sampleEnrollees;
        const principal = principals[1];
        const res = await app
          .post('/api/v1/enrollees')
          .set('authorization', token)
          .field('enrolmentType', 'special-principal')
          .field('scheme', principal.scheme)
          .field('id', 1)
          .field('surname', principal.surname)
          .field('firstName', principal.firstName)
          .field('gender', principal.gender)
          .field('serviceNumber', 'SN/TEST/001')
          .field('rank', 'Gen.')
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
        res.status !== 201 && log(res.body);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('data');
        const { data } = res.body;
        expect(data).toEqual(
          expect.objectContaining({
            id: '00001',
            isPrincipal: true,
            scheme: principal.scheme,
          })
        );
        expect(true).toBe(true);
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
