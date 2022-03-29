import supertest from 'supertest';

import server from '../../../src/server';

const app = supertest(server.server);

class ClaimsApi {
  static processBulkClaims(payload, token) {
    return app.patch('/api/v1/claims').set('authorization', token).send(payload);
  }
  static verifyRefcode(code, token) {
    return app.get(`/api/v1/refcodes/verify?referalCode=${code}`).set('authorization', token);
  }
  static addClaims(payload, token) {
    return app.post('/api/v1/claims').set('authorization', token).send(payload);
  }
  static getClaims(token) {
    return app.get('/api/v1/claims').set('authorization', token);
  }
}

export default ClaimsApi;
