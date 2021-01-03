import supertest from 'supertest';
import server from '../../src/server';
import AppTestHelper from '../app/app.testHelper';
import db from '../../src/database/models';

const app = supertest(server.server);
const roleHelper = new AppTestHelper();

describe('RoleController', () => {
  describe('addNewRole', () => {
    beforeAll(async () => {
      await roleHelper.resetDB();
    });
    it('creates a new role', async (done) => {
      try {
        const res = await app
          .post('/api/v1/roles')
          .send({ name: 'superadmin' });
        const { data } = res.body;
        const createdRole = await db.Role.findOne({ where: { id: data.id } });
        expect(createdRole.name).toEqual(data.name);
        done();
      } catch (e) {
        done(e);
      }
    });

    it('catches errors thrown in the try block', async (done) => {
      try {
        const origingalImplementation = db.Role.create;
        db.Role.create = jest.fn().mockImplementation(() => {
          throw new Error('bummer!');
        });
        const res = await app.post('/api/v1/roles').send({ name: 'admin' });
        db.Role.create = origingalImplementation;
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error', 'bummer!');
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  describe('updateRole', () => {
    let role;
    beforeAll(async () => {
      await roleHelper.resetDB();
      role = await db.Role.create({ name: 'user' });
    });
    it('updates an existing role', async (done) => {
      try {
        await app.patch(`/api/v1/roles/${role.id}`).send({ name: 'admin' });
        const updatedRole = await db.Role.findOne({ where: { id: role.id } });
        expect(role.id).toEqual(updatedRole.id);
        expect(role.name).toBe('user');
        expect(updatedRole.name).toBe('admin');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns 409 error for duplicate role during update', async (done) => {
      try {
        const existingRole = await db.Role.findOne({
          where: { id: role.id },
        });
        const diffrentRoleId = role.id + 1;
        const res = await app
          .patch(`/api/v1/roles/${diffrentRoleId}`)
          .send({ name: existingRole.name });
        const errorMsg =
          'role name admin already exists. Duplicate name is not allowed';
        expect(res.status).toEqual(409);
        expect(res.body).toHaveProperty('error', errorMsg);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns 404 error if the role id is not found', async (done) => {
      try {
        const invalidRoleId = role.id + 1;
        const res = await app
          .patch(`/api/v1/roles/${invalidRoleId}`)
          .send({ name: 'user' });
        expect(res.status).toEqual(404);
        expect(res.body).toHaveProperty(
          'error',
          `no role matches the id of ${invalidRoleId}`
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('catches errors thrown in the try block', async (done) => {
      try {
        const origingalImplementation = db.Role.findOne;
        db.Role.findOne = jest.fn().mockImplementation(() => {
          throw new Error('bummer!');
        });
        const res = await app
          .patch(`/api/v1/roles/${role.id}`)
          .send({ name: 'admin' });
        db.Role.findOne = origingalImplementation;
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error', 'bummer!');
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  describe('deleteRole', () => {
    let role;
    beforeAll(async () => {
      await roleHelper.resetDB();
      role = await db.Role.create({ name: 'user' });
    });
    it('delete the role matching the specified id', async (done) => {
      try {
        const res = await app.delete(`/api/v1/roles/${role.id}`);
        const deletedRole = await db.Role.findOne({ where: { id: role.id } });
        expect(res.status).toBe(200);
        expect(deletedRole).toBe(null);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('catches errors thrown in the try block', async (done) => {
      try {
        const origingalImplementation = db.Role.findOne;
        db.Role.findOne = jest.fn().mockImplementation(() => {
          throw new Error('bummer!');
        });
        const res = await app.delete(`/api/v1/roles/${role.id}`);
        db.Role.findOne = origingalImplementation;
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error', 'bummer!');
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
