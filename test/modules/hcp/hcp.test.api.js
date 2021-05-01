import supertest from 'supertest';
import moment from 'moment';

import server from '../../../src/server';
import TestService from '../app/app.test.service';

export const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
export const today = moment().format('YYYY-MM-DD');
export const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

const app = supertest(server.server);

class HcpApi extends TestService {
  static async register(hcp, token) {
    const payload = hcp;
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

  static async changeStatus(payload, token) {
    const res = await app
      .patch('/api/v1/hcp/status')
      .set('authorization', token)
      .send(payload);
    return res;
  }

  static async delete(hcpId, token) {
    return await app.delete(`/api/v1/hcp/${hcpId}`).set('authorization', token);
  }

  static async getAll(query, token) {
    return await app.get(`/api/v1/hcp?${query}`).set('authorization', token);
  }

  static getDropDownListOfHcps(query, token) {
    return app.get(`/api/v1/hcp/dropdown?${query}`).set('authorization', token);
  }
  static getById(hcpId, token) {
    return app.get(`/api/v1/hcp/${hcpId}`).set('authorization', token);
  }

  static getManifest(query, token) {
    return app.get(`/api/v1/hcp/manifest?${query}`).set('authorization', token);
  }

  static getCapitation(query, token) {
    return app
      .get(`/api/v1/hcp/capitation?${query}`)
      .set('authorization', token);
  }

  static printCapitationSummary(query, token) {
    return app
      .get(`/api/v1/hcp/print_capitation?${query}`)
      .set('authorization', token);
  }

  static downloadHcpManifest(hcpId, token) {
    return app.get(`/api/v1/hcp/${hcpId}/download_manifest?token=${token}`);
  }

  static getVerifiedHcpEnrollees({ hcpId, query = '', token }) {
    return app
      .get(`/api/v1/hcp/${hcpId}/verified_enrollees?${query}`)
      .set('authorization', token);
  }
}

export default HcpApi;
