import supertest from 'supertest';
import moment from 'moment';

import server from '../../../src/server';
import TestService from '../app/app.test.service';

export const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
export const today = moment().format('YYYY-MM-DD');
export const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

const app = supertest(server.server);

class HcpApi extends TestService {
  static async register(enrolee, token) {
    const payload = enrolee;
    const res = await app
      .post('/api/v1/hcp')
      .set('authorization', token)
      .send(payload);
    return res;
  }

  static async update(hcpId, changes, token) {
    const res = await app
      .patch(`/api/v1/hcp/${hcpId}`)
      .set('authorization', token)
      .send(changes);
    return res;
  }

  static async verify(principalId, token) {
    const res = await app
      .patch(`/api/v1/hcp/${principalId}/verify`)
      .set('authorization', token);
    return res;
  }

  static async unverify(principalId, token) {
    return await app
      .patch(`/api/v1/hcp/${principalId}/unverify`)
      .set('authorization', token);
  }

  static async delete(hcpId, token) {
    return await app.delete(`/api/v1/hcp/${hcpId}`).set('authorization', token);
  }

  static async getAll(query, token) {
    return await app.get(`/api/v1/hcp?${query}`).set('authorization', token);
  }
  static getById(hcpId, token) {
    return app.get(`/api/v1/hcp/${hcpId}`).set('authorization', token);
  }
}

export default HcpApi;
