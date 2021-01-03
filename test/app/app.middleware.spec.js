import supertest from 'supertest';

import db from '../../src/database/models';
import server from '../../src/server';
import { sampleUsers } from '../user/user.testSamples';
import AppTestHelper from './app.testHelper';
import AppMiddleware from '../../src/resources/app/app.middleware';

const app = supertest(server.server);
const testHelper = new AppTestHelper();

describe('AppMiddleware', () => {
  beforeAll(async () => {
    await testHelper.resetDB([db.User]);
  });
  it('returns 400 error if upload filed name is not "image"', async (done) => {
    try {
      const { firstName, lastName, username, email, password } = sampleUsers[0];
      const imageFile = `${process.cwd()}/test/testData/img.sample.jpg`;
      const res = await app
        .post('/api/v1/users')
        .field('firstName', firstName)
        .field('lastName', lastName)
        .field('username', username)
        .field('email', email)
        .field('password', password)
        .attach('imageZZZZZ', imageFile);
      expect(res.status).toBe(400);
      const errorMsg =
        'missing field "image". Image file must be uploaded as field "image"';
      expect(res.body).toHaveProperty('error', errorMsg);
      done();
    } catch (e) {
      done(e);
    }
  });
  it('returns 400 error if image size is greater than 3MB', async (done) => {
    try {
      const { firstName, lastName, username, email, password } = sampleUsers[0];
      const imageFile = `${process.cwd()}/test/testData/img.sample2.jpg`;
      const res = await app
        .post('/api/v1/users')
        .field('firstName', firstName)
        .field('lastName', lastName)
        .field('username', username)
        .field('email', email)
        .field('password', password)
        .attach('image', imageFile);
      expect(res.status).toBe(400);
      const errorMsg = 'cannot upload image greater than 3000KB in size';
      expect(res.body).toHaveProperty('error', errorMsg);
      done();
    } catch (e) {
      done(e);
    }
  });
  it('returns 415 error if image format is not supported', async (done) => {
    try {
      const { firstName, lastName, username, email, password } = sampleUsers[0];
      const imageFile = `${process.cwd()}/test/testData/img.sample3.gif`;
      const res = await app
        .post('/api/v1/users')
        .field('firstName', firstName)
        .field('lastName', lastName)
        .field('username', username)
        .field('email', email)
        .field('password', password)
        .attach('image', imageFile);
      expect(res.status).toBe(415);
      const errorMsg = 'image format must be jpeg or png';
      expect(res.body).toHaveProperty('error', errorMsg);
      done();
    } catch (e) {
      done(e);
    }
  });
  it('returns 400 error if req.files is emplty', async (done) => {
    try {
      const req = { files: {} };
      const res = { status: jest.fn() };
      const next = jest.fn();
      await AppMiddleware.validateImageUpload(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      done();
    } catch (e) {
      done(e);
    }
  });
  it(' catches and handles errors thrown in the try block', async (done) => {
    try {
      const req = undefined;
      const res = {
        status: (statusCode) => ({
          json: (obj) => ({ response: { data: obj, status: statusCode } }),
        }),
      };
      const next = jest.fn();
      await AppMiddleware.validateImageUpload(req, res, next);
      expect(next).toHaveBeenCalled();
      done();
    } catch (e) {
      done(e);
    }
  });
});
