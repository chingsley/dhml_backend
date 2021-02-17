import supertest from 'supertest';

import server from '../../../src/server';

const app = supertest(server.server);

class UserApi {
  static async register(user, token) {
    return await app
      .post('/api/v1/users')
      .set('authorization', token)
      .send(user);
  }

  static async edit(userId, changes, token) {
    return await app
      .patch(`/api/v1/users/${userId}`)
      .set('authorization', token)
      .send(changes);
  }
}

export default UserApi;
