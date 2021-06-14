import supertest from 'supertest';

import server from '../../../src/server';

const app = supertest(server.server);

class RefcodeApi {
  static requestForCode(payload, token) {
    return app
      .post('/api/v1/refcodes')
      .set('authorization', token)
      .send(payload);
  }
  static verifyRefcode(code, token) {
    return app
      .get(`/api/v1/refcodes/verify?referalCode=${code}`)
      .set('authorization', token);
  }
  static changeFlagStatus(refcodeId, payload, token) {
    return app
      .patch(`/api/v1/refcodes/${refcodeId}/flag`)
      .send(payload)
      .set('authorization', token);
  }
  static deleteRefcode(payload, token) {
    return app
      .delete('/api/v1/refcodes')
      .send(payload)
      .set('authorization', token);
  }

  static getReferalCodes(query = '', token) {
    return app.get(`/api/v1/refcodes?${query}`).set('authorization', token);
  }

  static getEnrolleeCodeHistory(query, token) {
    return app
      .get(`/api/v1/refcodes/history?${query}`)
      .set('authorization', token);
  }
}

export default RefcodeApi;
