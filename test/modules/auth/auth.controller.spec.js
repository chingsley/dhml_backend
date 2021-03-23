/* eslint-disable jest/expect-expect */
const sgMail = require('@sendgrid/mail');

/**
 *  If try to import AuthController in this file, I get error:
 *  ' secretOrPrivateKey must have a value'. I don't understand
 * it yet
 */
// import AuthController from '../../../src/modules/auth/auth.controller';
import { LGN003 } from '../../../src/shared/constants/errors.constants';
import { TEST_PASSWORD } from '../../../src/shared/constants/passwords.constants';
import TestService from '../app/app.test.service';
import AuthApi from './auth.test.api';
import _AuthService from './auth.test.service';

describe('authController', () => {
  let originalSendGridImplemenation = sgMail.send;
  beforeAll(() => {
    sgMail.send = jest.fn().mockImplementation(() => true);
  });
  afterAll(() => {
    sgMail.send = originalSendGridImplemenation;
  });
  describe('login', () => {
    let res1, res2, res3;
    beforeAll(async () => {
      await TestService.resetDB();
      const [user] = await TestService.seedUsers(1);
      const [hcp] = await TestService.seedHCPs(1);
      res1 = await AuthApi.login({
        email: user.staffInfo.email,
        password: TEST_PASSWORD,
        userType: 'user',
      });
      res2 = await AuthApi.login({
        username: hcp.email,
        password: TEST_PASSWORD,
        userType: 'hcp',
      });
      res3 = await AuthApi.login({
        username: hcp.code,
        password: TEST_PASSWORD,
        userType: 'hcp',
      });
    });

    it('logs in a user with valid email and password', async (done) => {
      try {
        const { data } = res1.body;
        expect(res1.status).toBe(200);
        expect(res1.body).toHaveProperty('message');
        expect(res1.body).toHaveProperty('data');
        expect(data).toHaveProperty('user');
        expect(data).toHaveProperty('token');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('logs in a hcp with valid email and password', async (done) => {
      try {
        const { data } = res2.body;
        expect(res2.status).toBe(200);
        expect(res2.body).toHaveProperty('message');
        expect(res2.body).toHaveProperty('data');
        expect(data).toHaveProperty('hcp');
        expect(data).toHaveProperty('token');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('logs in a hcp with valid code and password', async (done) => {
      try {
        const { data } = res2.body;
        expect(res3.status).toBe(200);
        expect(res3.body).toHaveProperty('message');
        expect(res3.body).toHaveProperty('data');
        expect(data).toHaveProperty('hcp');
        expect(data).toHaveProperty('token');
        done();
      } catch (e) {
        done(e);
      }
    });
    // it(
    //   'it catches errors thrown in the try block ',
    //   TestService.testCatchBlock(AuthController.login)
    // );
  });
  describe('changePasswod', () => {
    let res1, res2, user, hcp;
    const payload = {
      oldPassword: TEST_PASSWORD,
      newPassword: '*123Testing',
    };
    beforeAll(async () => {
      await TestService.resetDB();
      [user] = await TestService.seedUsers(1);
      [hcp] = await TestService.seedHCPs(1);
      const {
        body: {
          data: { token: userToken },
        },
      } = await AuthApi.login({
        email: user.staffInfo.email,
        password: TEST_PASSWORD,
        userType: 'user',
      });
      const {
        body: {
          data: { token: hcpToken },
        },
      } = await AuthApi.login({
        username: hcp.code,
        password: TEST_PASSWORD,
        userType: 'hcp',
      });
      res1 = await AuthApi.changePassword(payload, userToken);
      res2 = await AuthApi.changePassword(payload, hcpToken);
    });

    it('returns status 200 and a message on successful user password change', async (done) => {
      try {
        expect(res1.status).toBe(200);
        expect(res1.body).toHaveProperty('message');
        expect(res1.body).toHaveProperty('data');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns status 200 and a message on successful hcp password change', async (done) => {
      try {
        expect(res2.status).toBe(200);
        expect(res2.body).toHaveProperty('message');
        expect(res2.body).toHaveProperty('data');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it sets the user"s "isDefaultPassword" to false', async (done) => {
      try {
        const password = await _AuthService.getPasswordDetails(
          'userId',
          user.id
        );
        expect(password.isDefaultValue).toBe(false);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it sets the hcp"s "isDefaultPassword" to false', async (done) => {
      try {
        const password = await _AuthService.getPasswordDetails('hcpId', hcp.id);
        expect(password.isDefaultValue).toBe(false);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it ensures user cannot login with old password', async (done) => {
      try {
        const res = await AuthApi.login({
          email: user.staffInfo.email,
          password: TEST_PASSWORD,
          userType: 'user',
        });
        const { errors, errorCode } = res.body;
        const expectedError = 'Login failed. Invalid credentials';
        expect(res.status).toBe(401);
        expect(errors[0]).toEqual(expectedError);
        expect(errorCode).toEqual(LGN003);

        done();
      } catch (e) {
        done(e);
      }
    });
    it('it ensures hcp cannot login with old password', async (done) => {
      try {
        const res = await AuthApi.login({
          username: hcp.code,
          password: TEST_PASSWORD,
          userType: 'hcp',
        });
        const { errors, errorCode } = res.body;
        const expectedError = 'Login failed. Invalid credentials';
        expect(res.status).toBe(401);
        expect(errors[0]).toEqual(expectedError);
        expect(errorCode).toEqual(LGN003);

        done();
      } catch (e) {
        done(e);
      }
    });
    it('it ensures user can login with new password', async (done) => {
      try {
        const res = await AuthApi.login({
          email: user.staffInfo.email,
          password: payload.newPassword,
          userType: 'user',
        });
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(data.user.id).toBe(user.id);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it ensures hcp can login with new password', async (done) => {
      try {
        const res = await AuthApi.login({
          username: hcp.code,
          password: payload.newPassword,
          userType: 'hcp',
        });
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(data.hcp.id).toBe(hcp.id);
        done();
      } catch (e) {
        done(e);
      }
    });
    // it(
    //   'it catches errors thrown in the try block ',
    //   TestService.testCatchBlock(AuthController.changePassword)
    // );
  });
});
