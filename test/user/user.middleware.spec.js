import supertest from 'supertest';
import Joi from '@hapi/joi';

import server from '../../src/server';
import { sampleUsers } from './user.testSamples';

const app = supertest(server.server);

describe('UserMiddleware', () => {
  describe('validateNewUser', () => {
    it('detects missing fields', async (done) => {
      try {
        const requiredFields = ['email', 'username', 'password'];
        for (let field of requiredFields) {
          const res = await app.post('/api/v1/users').send({
            ...sampleUsers[0],
            [field]: undefined,
          });
          expect(res.status).toBe(400);
          expect(res.body).toHaveProperty('error', `"${field}" is required`);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('detects unknown fields', async (done) => {
      try {
        const res = await app.post('/api/v1/users').send({
          ...sampleUsers[0],
          maritalStatus: 'single',
        });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty(
          'error',
          '"maritalStatus" is not allowed'
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('enforces strong password', async (done) => {
      try {
        const res = await app.post('/api/v1/users').send({
          ...sampleUsers[0],
          password: 'testing',
        });
        expect(res.status).toBe(400);
        const errorMsg =
          'password must be a minimum of 8 characters long, must contain a lowercase, an uppercase, a number and a special character';
        expect(res.body).toHaveProperty('error', errorMsg);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('enforces a defined format for username', async (done) => {
      try {
        const res = await app.post('/api/v1/users').send({
          ...sampleUsers[0],
          username: 'ching/sley',
        });
        expect(res.status).toBe(400);
        const errorMsg =
          'invalid username. Username can only consist of lowercase letters, numbers, a dash and/or an underscore';
        expect(res.body).toHaveProperty('error', errorMsg);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('catches errors thrown in the try block', async (done) => {
      try {
        const originalImplementation = Joi.object;
        const sampleError = 'let"s pretend something went wrong';
        Joi.object = jest.fn().mockImplementation(() => {
          throw new Error(sampleError);
        });
        const res = await app.post('/api/v1/users').send(sampleUsers[0]);
        Joi.object = originalImplementation;
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error', sampleError);
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  describe('validateEmail', () => {
    it('it returns 400 error for invalid or missing email', async (done) => {
      try {
        const res = await app
          .post('/api/v1/auth/request_password_reset')
          .send({ email: 'inalid_email' });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty(
          'error',
          '"email" must be a valid email'
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it catches erros thrown in the try block', async (done) => {
      try {
        const sampleError = 'bummer!';
        const originalImplementation = Joi.object;
        Joi.object = jest.fn().mockImplementation(() => {
          throw new Error(sampleError);
        });
        const res = await app
          .post('/api/v1/auth/request_password_reset')
          .send({ email: 'inalid_email' });
        Joi.object = originalImplementation;
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error', sampleError);
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
