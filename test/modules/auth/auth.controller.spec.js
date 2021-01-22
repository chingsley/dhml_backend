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
    let res;
    beforeAll(async () => {
      await TestService.resetDB();
      const {
        users: [user],
      } = await TestService.seedUsers(1);
      res = await app.post('/api/v1/auth/login').send({
        email: user.email,
        password: 'Testing*123',
      });
    });

    it('logs in a user with valid email and password', async (done) => {
      try {
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('data');
        expect(data).toHaveProperty('user');
        expect(data).toHaveProperty('token');
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
