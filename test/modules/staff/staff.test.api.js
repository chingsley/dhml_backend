import supertest from 'supertest';
import moment from 'moment';

import server from '../../../src/server';

export const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
export const today = moment().format('YYYY-MM-DD');
export const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

const app = supertest(server.server);

class StaffApi {
  static async register(enrolee, token) {
    const payload = enrolee;
    const res = await app
      .post('/api/v1/staffs')
      .set('authorization', token)
      .send(payload);
    return res;
  }

  static async update(staffId, changes, token) {
    const res = await app
      .patch(`/api/v1/staffs/${staffId}`)
      .set('authorization', token)
      .send(changes);
    return res;
  }

  static async delete(staffId, token) {
    return await app
      .delete(`/api/v1/staffs/${staffId}`)
      .set('authorization', token);
  }

  static async getAll(query, token) {
    return await app.get(`/api/v1/staffs?${query}`).set('authorization', token);
  }
}

export default StaffApi;
