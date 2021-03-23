/* eslint-disable jest/expect-expect */
import faker from 'faker';
import { days, months } from '../../../src/utils/timers';
import TestService from '../app/app.test.service';
import { randInt } from '../../../src/utils/helpers';
import supertest from 'supertest';
import moment from 'moment';
import { Op } from 'sequelize';
import db from '../../../src/database/models';
import server from '../../../src/server';
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
        .field('armOfService', enrolee.armOfService)
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
    const res = await app
      .patch(`/api/v1/enrollees/${enrolleeId}`)
      .set('authorization', token)
      .send(changes);
    return res;
  }

  static async verifyPrincipal(principalId, token) {
    const res = await app
      .patch(`/api/v1/enrollees/${principalId}/verify`)
      .set('authorization', token);
    return res;
  }

  static async unverifyPrincipal(principalId, token) {
    return await app
      .patch(`/api/v1/enrollees/${principalId}/unverify`)
      .set('authorization', token);
  }

  static async deleteEnrollee(enrolleeId, token) {
    return await app
      .delete(`/api/v1/enrollees/${enrolleeId}`)
      .set('authorization', token);
  }

  static async addDependantsToPrincipal(dependants, principal) {
    return await db.Enrollee.bulkCreate(
      dependants.map((dependant) => ({
        ...dependant,
        principalId: principal.id,
        scheme: principal.scheme,
        hcpId: principal.hcpId,
      }))
    );
  }
  static getPrincipalDependants(principalId) {
    return db.Enrollee.findAll({ where: { principalId } });
  }

  static async getEnrolleesByIdArray(idArr) {
    return db.Enrollee.findAll({ where: { id: { [Op.in]: idArr } } });
  }

  static findById(id) {
    return db.Enrollee.findOne({
      where: { id },
      include: { model: db.Enrollee, as: 'dependants' },
    });
  }
  static async seedAfrship(sampleEnrollees, hcps) {
    const principals = sampleEnrollees.principals;
    const seededPrincipals = await TestService.seedEnrollees(
      principals.map((principal, i) => ({
        ...principal,
        scheme: 'AFRSHIP',
        enrolmentType: 'principal',
        serviceNumber: `NN/000${i}`,
        hcpId: hcps[randInt(0, hcps.length - 1)].id,
        isVerified: true,
        dateVerified: faker.date.between(months.setPast(3), days.today),
        staffNumber: null,
      }))
    );
    const deps = sampleEnrollees.dependants.map((d) => {
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
    const seededDependants = await TestService.seedEnrollees(deps);
    return { principals: seededPrincipals, dependants: seededDependants };
  }
}

export default EnrolleeTest;
