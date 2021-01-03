import supertest from 'supertest';
import server from '../../src/server';
import Joi from '@hapi/joi';

const app = supertest(server.server);

describe('RoleMiddleware', () => {
  describe('validateRole', () => {
    it('returns 400 error is name is not provided during create', async (done) => {
      try {
        const res = await app.post('/api/v1/roles').send({ nameZZZZ: 'user' });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', '"name" is required');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('catches errors thrown in the try block', async (done) => {
      try {
        const originalImplementation = Joi.object;
        Joi.object = jest.fn().mockImplementation(() => {
          throw new Error('bummer!');
        });
        const res = await app.post('/api/v1/roles').send({ nameZZZZ: 'user' });
        Joi.object = originalImplementation;
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error', 'bummer!');
        done();
      } catch (e) {
        done(e);
      }
    });
  });
  describe('validateRoleId', () => {
    it('returns 400 error role id is not a postive integer', async (done) => {
      try {
        const invalidRoleId = -1;
        const res = await app.delete(`/api/v1/roles/${invalidRoleId}`);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty(
          'error',
          '"id" must be larger than or equal to 1'
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('catches errors thrown in the try block', async (done) => {
      try {
        const originalImplementation = Joi.object;
        Joi.object = jest.fn().mockImplementation(() => {
          throw new Error('bummer!');
        });
        const res = await app.delete('/api/v1/roles/1');
        Joi.object = originalImplementation;
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error', 'bummer!');
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
