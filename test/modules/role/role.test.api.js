import supertest from 'supertest';

import server from '../../../src/server';

const app = supertest(server.server);

class RoleApi {
  static getAll(token) {
    return app.get('/api/v1/roles').set('authorization', token);
  }
}

export default RoleApi;
