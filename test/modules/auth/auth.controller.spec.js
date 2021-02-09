const sgMail = require('@sendgrid/mail');

import TestService from '../app/app.test.service';
import AuthApi from './auth.test.api';

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
      res = await AuthApi.login({
        email: user.email,
        password: 'Testing*123',
        userType: 'user',
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
