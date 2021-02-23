import supertest from 'supertest';

import server from '../../../src/server';

const app = supertest(server.server);

class RefcodeApi {
  static generateNewCode(payload, token) {
    return app
      .post('/api/v1/refcodes')
      .set('authorization', token)
      .send(payload);
  }
}

export default RefcodeApi;
