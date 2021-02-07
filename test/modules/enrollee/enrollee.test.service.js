import supertest from 'supertest';
import moment from 'moment';
import db from '../../../src/database/models';

import server from '../../../src/server';
import TestService from '../app/app.test.service';

export const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
export const today = moment().format('YYYY-MM-DD');
export const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
const imageFile = `${process.cwd()}/src/shared/samples/docs/img.sample.jpg`;

const app = supertest(server.server);

class EnrolleeTest extends TestService {
  static async enrol(enrolee, token, options = { withUploads: false }) {
    let res;
    if (options.withUploads) {
      res = await app
        .post('/api/v1/enrollees')
        .set('authorization', token)
        .field('enrolmentType', enrolee.enrolmentType)
        .field('scheme', enrolee.scheme)
        .field('surname', enrolee.surname)
        .field('firstName', enrolee.firstName)
        .field('gender', enrolee.gender)
        .field('serviceNumber', enrolee.serviceNumber)
        .field('rank', enrolee.rank)
        .field('dateOfBirth', '2000-01-02')
        .field('identificationType', enrolee.identificationType)
        .field('identificationNumber', enrolee.identificationNumber)
        .field('serviceStatus', enrolee.serviceStatus)
        .field('phoneNumber', enrolee.phoneNumber)
        .field('email', enrolee.email)
        .field('residentialAddress', enrolee.residentialAddress)
        .field('stateOfResidence', enrolee.stateOfResidence)
        .field('lga', enrolee.lga)
        .field('bloodGroup', enrolee.bloodGroup)
        .field('significantMedicalHistory', enrolee.significantMedicalHistory)
        .field('hcpId', enrolee.hcpId)
        .attach('photograph', imageFile)
        .attach('birthCertificate', imageFile)
        .attach('marriageCertificate', imageFile)
        .attach('idCard', imageFile)
        .attach('deathCertificate', imageFile)
        .attach('letterOfNok', imageFile);
      return res;
    } else {
      const payload = enrolee;
      res = await app
        .post('/api/v1/enrollees')
        .set('authorization', token)
        .send(payload);
    }
    return res;
  }

  static async update(enrolleeId, changes, token) {
    // console.log(enrollee.id);
    // const enrolleeId = enrollee.id;
    // const payload = enrollee;
    const res = await app
      .patch(`/api/v1/enrollees/${enrolleeId}`)
      .set('authorization', token)
      .send(changes);
    return res;
  }

  static async addDependantsToPrincipal(dependants, principal) {
    return await db.Enrollee.create(
      dependants.map((dependant) => ({
        ...dependant,
        principalId: principal.id,
        scheme: principal.scheme,
      }))
    );
  }
}

export default EnrolleeTest;
