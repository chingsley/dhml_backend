import supertest from 'supertest';

import server from '../../../src/server';

const app = supertest(server.server);

class UserApi {
  static register(user, token) {
    return app.post('/api/v1/users').set('authorization', token).send(user);
  }

  static getAll(token) {
    return app.get('/api/v1/users').set('authorization', token);
  }

  static edit(userId, changes, token) {
    return app
      .patch(`/api/v1/users/${userId}`)
      .set('authorization', token)
      .send(changes);
  }

  static delete(userId, token) {
    return app.delete(`/api/v1/users/${userId}`).set('authorization', token);
  }
}

export default UserApi;
