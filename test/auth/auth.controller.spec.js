import supertest from 'supertest';
const sgMail = require('@sendgrid/mail');

import db from '../../src/database/models';

import server from '../../src/server';

import { sampleUsers } from '../user/user.testSamples';
import UserTestHelper from '../user/user.testHelper';
import AuthTestHelper from './auth.testHelper';
import { yesterday } from '../app/app.testHelper';

const app = supertest(server.server);

const userHelper = new UserTestHelper();
const authHelper = new AuthTestHelper();

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
      await userHelper.resetDB();
      user = await userHelper.createUser({
        user: sampleUsers[0],
        role: 'user',
      });
    });

    it('logs in a user with valid email and password', async (done) => {
      try {
        const res = await app.post('/api/v1/auth/login').send({
          email: user.email,
          password: sampleUsers[0].password,
        });
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(data.user).toEqual(
          expect.objectContaining({
            id: user.id,
            uuid: user.uuid,
            email: user.email,
            username: user.username,
          })
        );
        expect(data).toHaveProperty('token');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('logs in a user with valid username and password', async (done) => {
      try {
        const res = await app.post('/api/v1/auth/login').send({
          username: user.username,
          password: sampleUsers[0].password,
        });
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(data.user).toEqual(
          expect.objectContaining({
            id: user.id,
            uuid: user.uuid,
            email: user.email,
            username: user.username,
          })
        );
        expect(data).toHaveProperty('token');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns status 401 if email/username not found', async (done) => {
      try {
        const res = await app.post('/api/v1/auth/login').send({
          username: user.username + 'invalid',
          password: sampleUsers[0].password,
        });
        const expectedError = 'Login failed. Invalid credentials.';
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns status 401 if password is incorrect', async (done) => {
      try {
        const res = await app.post('/api/v1/auth/login').send({
          username: user.username,
          password: sampleUsers[0].password + 'invalid',
        });
        const expectedError = 'Login failed. Invalid credentials.';
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  describe('requestPasswordReset', () => {
    let res,
      email = sampleUsers[0].email;
    beforeAll(async () => {
      await userHelper.resetDB([db.User, db.Role]);
      await userHelper.createUser({
        user: sampleUsers[0],
        role: 'user',
      });
      res = await app
        .post('/api/v1/auth/request_password_reset')
        .send({ email });
    });

    it('returns 200 on successful response', async (done) => {
      try {
        expect(res.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });

    it('returns a message asking the user to check their mail for reset instructions', async (done) => {
      try {
        const message = `Please check your inbox ${email} for password reset instructions.`;
        expect(res.body).toHaveProperty('message', message);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('cacthes errors thrown in the try block', async (done) => {
      try {
        const originalImplementation = db.User.findOne;
        const error = 'bummer!';
        db.User.findOne = jest.fn().mockImplementation(() => {
          throw new Error(error);
        });
        const res = await app
          .post('/api/v1/auth/request_password_reset')
          .send({ email: 'user@gmail.com' });
        db.User.findOne = originalImplementation;
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error', error);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('does not send mail if no user matches the supplied email', async (done) => {
      try {
        const originalImplementation = sgMail.send;
        sgMail.send = jest.fn();
        await app
          .post('/api/v1/auth/request_password_reset')
          .send({ email: 'nouser@gmail.com' });
        expect(sgMail.send).not.toHaveBeenCalled();
        sgMail.send = originalImplementation;
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  describe('validatePasswordResetToken', () => {
    let user,
      resetToken,
      sampleUser = sampleUsers[0];
    beforeAll(async () => {
      await userHelper.resetDB([db.User]);
      user = await userHelper.createUser({ user: sampleUser, role: 'user' });
      const originalImplementation = sgMail.send;
      sgMail.send = jest.fn().mockImplementation(() => true);
      await app
        .post('/api/v1/auth/request_password_reset')
        .send({ email: user.email });
      sgMail.send = originalImplementation;
      resetToken = await authHelper.getUserPasswordResetToken(user.email);
    });
    it('returns 200 upon successful validation', async (done) => {
      try {
        const res = await app
          .get('/api/v1/auth/validate_password_reset_token')
          .set('token', resetToken);
        expect(res.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });

    it('returns status 400 with errorCode PRT001 if the token is not a valid uuid', async (done) => {
      try {
        const res = await app
          .get('/api/v1/auth/validate_password_reset_token')
          .set('token', 'INVALID-UUID-VALUE');
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'invalid token');
        expect(res.body).toHaveProperty('errorCode', 'PRT001');
        done();
      } catch (e) {
        done(e);
      }
    });

    it('returns status 400 with errorCode PRT002 if the reset token is not found', async (done) => {
      try {
        const res = await app
          .get('/api/v1/auth/validate_password_reset_token')
          .set('token', `404${resetToken.slice(3)}`);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'invalid token');
        expect(res.body).toHaveProperty('errorCode', 'PRT002');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns status 400 with errorCode PRT003 if the reset token is expired', async (done) => {
      try {
        await authHelper.updatePasswordResetToken(resetToken, {
          expires: yesterday,
        });
        const res = await app
          .get('/api/v1/auth/validate_password_reset_token')
          .set('token', resetToken);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'invalid token');
        expect(res.body).toHaveProperty('errorCode', 'PRT003');
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  describe('changePassword', () => {
    let subjectUser = sampleUsers[0];
    let resetToken,
      res,
      userNewPassword = 'GniTset#395';
    beforeAll(async () => {
      await authHelper.resetDB();
      const user = await userHelper.createUser({
        user: subjectUser,
        role: 'user',
      });
      await app
        .post('/api/v1/auth/request_password_reset')
        .send({ email: subjectUser.email });
      const userPasswordReset = await db.PasswordReset.findOne({
        where: { userId: user.id },
      });
      resetToken = userPasswordReset.resetToken;
      res = await app
        .patch(`/api/v1/auth/password/${resetToken}`)
        .send({ password: userNewPassword });
    });

    it('returns status 200  and a success message when password update is successful', async (done) => {
      try {
        const successMsg = 'Your password was successfully updated';
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', successMsg);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('ensures user"s old password will fail login with status 401 and errorCode LGN002', async (done) => {
      try {
        const { email, password } = subjectUser;
        const res = await app
          .post('/api/v1/auth/login')
          .send({ email, password });
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('errorCode', 'LGN002');
        expect(res.body).toHaveProperty(
          'error',
          'Login failed. Invalid credentials.'
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('ensures user"s new password will pass login with status 200', async (done) => {
      try {
        const { email } = subjectUser;
        const res = await app
          .post('/api/v1/auth/login')
          .send({ email, password: userNewPassword });
        expect(res.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('prohibits repeated password update with same token, as token is destroyed on successful first attempt', async (done) => {
      try {
        res = await app
          .patch(`/api/v1/auth/password/${resetToken}`)
          .send({ password: userNewPassword });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'invalid token');
        // NOTE errorCode 'PRT002' means token is not found in the db
        expect(res.body).toHaveProperty('errorCode', 'PRT002');
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
