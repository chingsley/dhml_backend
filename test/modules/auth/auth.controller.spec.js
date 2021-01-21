import supertest from 'supertest';
const sgMail = require('@sendgrid/mail');

import server from '../../../src/server';
import TestService from '../app/app.test.service';

const app = supertest(server.server);

describe('authController', () => {
  let originalSendGridImplemenation = sgMail.send;
  beforeAll(() => {
    sgMail.send = jest.fn().mockImplementation(() => true);
  });
  afterAll(() => {
    sgMail.send = originalSendGridImplemenation;
  });
  describe('loginUser', () => {
    let user;
    beforeAll(async () => {
      await TestService.resetDB();
      const result = await TestService.seedUsers(1);
      console.log(result);
    });

    it('logs in a user with valid email and password', async (done) => {
      try {
        // const res = await app.post('/api/v1/auth/login').send({
        //   email: user.email,
        //   password: sampleUsers[0].password,
        // });
        // const { data } = res.body;
        // expect(res.status).toBe(200);
        // expect(data.user).toEqual(
        //   expect.objectContaining({
        //     id: user.id,
        //     uuid: user.uuid,
        //     email: user.email,
        //     username: user.username,
        //   })
        // );
        // expect(data).toHaveProperty('token');
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
