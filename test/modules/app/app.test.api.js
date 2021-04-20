import supertest from 'supertest';

import server from '../../../src/server';

server.server.timeout = 0;
const app = supertest(server.server);

class AppApi {
  static createVoucheer(payload, token) {
    return app
      .post('/api/v1/accounts/capitation/voucher')
      .set('authorization', token)
      .send(payload);
  }
}

export default AppApi;
