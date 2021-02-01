import supertest from 'supertest';
// import db from '../../../src/database/models';
// import getSampleStaffs from '../../../src/shared/samples/staff.samples';

import server from '../../../src/server';
import TestService from '../app/app.test.service';

const app = supertest(server.server);

class TestUser extends TestService {
  static async register(user, token) {
    let res;
    const payload = user;
    res = await app
      .post('/api/v1/users')
      .set('authorization', token)
      .send(payload);
    return res;
  }
}

export default TestUser;
