/* eslint-disable jest/expect-expect */
/* eslint-disable no-undef */
import TestService from '../app/app.test.service';
import _StaffService from '../staff/staff.test.services';
import faker from 'faker';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import ROLES from '../../../src/shared/constants/roles.constants';
import nodemailer from 'nodemailer';
import _UserService from './user.test.services';
import UserApi from './user.test.api';
import _RoleService from '../role/role.test.service';
import UserController from '../../../src/modules/user/user.controller';

describe('UserController', () => {
  const nodemailerOriginalImplementation = nodemailer.createTransport;
  beforeAll(() => {
    nodemailer.createTransport = jest.fn().mockReturnValue({
      sendMail: jest.fn().mockReturnValue({ status: 200 }),
    });
  });
  afterAll(() => {
    nodemailer.createTransport = nodemailerOriginalImplementation;
  });
  describe('registerUser', () => {
    let token, res, userPassword;
    beforeAll(async () => {
      await TestService.resetDB();
      const { sampleStaffs: stff } = getSampleStaffs(2);
      const seededStaff = await _StaffService.seedOne(stff[1]);
      const role = await TestService.createRole(ROLES.DEPT_USER);
      const user = {
        staffId: seededStaff.id,
        username: faker.internet.userName(seededStaff.firstName),
        roleId: role.id,
      };
      const data = await TestService.getToken(stff[0], ROLES.SUPERADMIN);
      token = data.token;
      res = await UserApi.register(user, token);
      const { data: registeredUser } = res.body;
      userPassword = await TestService.getPasswordByUserId(registeredUser.id);
    });

    it('returns status 201 with success message on successful registration', async (done) => {
      try {
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('message');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('sets the user"s isActive status to true by default', async (done) => {
      try {
        const { data } = res.body;
        expect(data.isActive).toBe(true);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('ensures the user has password with "isDefaultValue" set to true', async (done) => {
      try {
        expect(userPassword.isDefaultValue).toBe(true);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('sets the default password to expire in 24 hours', async (done) => {
      try {
        const date2 = userPassword.expiryDate;
        const timestamp = new Date(date2) - new Date();
        const hours = timestamp / (60 * 60 * 1000);
        expect(hours).toBeCloseTo(24);
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block ',
      TestService.testCatchBlock(UserController.registerUser)
    );
  });
  describe('getAllUsers', () => {
    let token, res, seededUsers;
    beforeAll(async () => {
      await TestService.resetDB();
      await _RoleService.seedAllRoles();
      const { sampleStaffs: stffs } = getSampleStaffs(10);
      const seededStaffs = await _StaffService.seedBulk(stffs);
      const role = await TestService.createRole(ROLES.BASIC);
      const sampleUsers = seededStaffs.map((stff) => ({
        staffId: stff.id,
        username: faker.internet.userName(stff.firstName),
        roleId: role.id,
      }));
      seededUsers = await _UserService.seedBulk(sampleUsers);
      const data = await TestService.getToken(stffs[0], ROLES.SUPERADMIN);
      token = data.token;
      res = await UserApi.getAll(token);
    });
    it('returns status 200 on successful update', async (done) => {
      try {
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(data.count).toEqual(seededUsers.length);
        expect(data.rows).toHaveLength(seededUsers.length);
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block ',
      TestService.testCatchBlock(UserController.getAllUsers)
    );
  });
  describe('updateUser', () => {
    let token, res, user1, user2, changes;
    beforeAll(async () => {
      await TestService.resetDB();
      await _RoleService.seedAllRoles();
      const { sampleStaffs: stffs } = getSampleStaffs(3);
      const seededStaffs = await _StaffService.seedBulk(stffs.slice(1));
      const role = await TestService.createRole(ROLES.BASIC);
      const sampleUsers = seededStaffs.map((stff) => ({
        staffId: stff.id,
        username: faker.internet.userName(stff.firstName),
        roleId: role.id,
      }));
      [user1, user2] = await _UserService.seedBulk(sampleUsers);
      const data = await TestService.getToken(stffs[0], ROLES.ADMIN);
      token = data.token;
      changes = { username: 'newmail45454', staffId: user1.staffId };
      res = await UserApi.edit(user1.id, changes, token);
    });
    it('returns status 200 on successful update', async (done) => {
      try {
        expect(res.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns the update user record', async (done) => {
      try {
        const { data } = res.body;
        expect(data).toEqual(
          expect.objectContaining({
            username: changes.username,
          })
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('allows same record update with same unique value', async (done) => {
      try {
        const { data } = res.body;
        expect(data).toEqual(
          expect.objectContaining({
            staffId: user1.staffId,
          })
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('detects unique violation during update', async (done) => {
      try {
        const changes = [{ staffId: user2.staffId }];
        for (let change of changes) {
          const res = await UserApi.edit(user1.id, change, token);
          const { errors } = res.body;
          expect(errors[0]).toMatch(/already exists/i);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('prevents non-superadmin user from changing user role during update', async (done) => {
      try {
        const hodAdminRole = await _RoleService.findByTitle(ROLES.HOD_ADMIN);
        const changes = { roleId: hodAdminRole.id };
        const res = await UserApi.edit(user1.id, changes, token);
        const expectedError =
          'You are only authorized to assign the "basic" role';
        const { errors } = res.body;
        expect(errors[0]).toEqual(expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('allows superadmin users to change user roles', async (done) => {
      try {
        const { sampleStaffs } = getSampleStaffs(1);
        const { token } = await TestService.getToken(
          sampleStaffs[0],
          ROLES.SUPERADMIN
        );
        const hodAdminRole = await _RoleService.findByTitle(ROLES.HOD_ADMIN);
        const changes = { roleId: hodAdminRole.id };
        const res = await UserApi.edit(user1.id, changes, token);
        const {
          data: { role },
        } = res.body;
        expect(res.status).toBe(200);
        expect(role.title).toBe(ROLES.HOD_ADMIN);
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block ',
      TestService.testCatchBlock(UserController.updateUser)
    );
  });
  describe('deleteUsers', () => {
    let token, res, user1, user2, stffs;
    beforeAll(async () => {
      await TestService.resetDB();
      await _RoleService.seedAllRoles();
      const COUNT_STAFF = 3;
      const { sampleStaffs } = getSampleStaffs(COUNT_STAFF);
      stffs = sampleStaffs;
      const seededStaffs = await _StaffService.seedBulk(
        stffs.slice(1, COUNT_STAFF)
      );
      const role = await TestService.createRole(ROLES.BASIC);
      const sampleUsers = seededStaffs.map((staff) => ({
        staffId: staff.id,
        username: faker.internet.userName(staff.firstName),
        roleId: role.id,
      }));
      [user1, user2] = await _UserService.seedBulk(sampleUsers);
      const data = await TestService.getToken(stffs[0], ROLES.ADMIN);
      token = data.token;
      res = await UserApi.delete([user1.id, user2.id], token);
    });
    it('returns status 200 on successful update', async (done) => {
      try {
        const { message } = res.body;
        expect(res.status).toBe(200);
        expect(message).toBe('user(s) deleted');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('deletes the record from the Users table', async (done) => {
      try {
        const user = await _UserService.findOneWhere({ id: user1.id });
        expect(user).toBe(null);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns a "not found" error for an attempt to reuse the deleted userId', async (done) => {
      try {
        const changes = { username: 'notfound@gmail.com' };
        const res = await UserApi.edit(user2.id, changes, token);
        const { errors } = res.body;
        expect(errors[0]).toMatch(/invalid userId/i);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('ensures only admin and superadmin can access the delete endpoint', async (done) => {
      try {
        const { token } = await TestService.getToken(stffs[0], ROLES.VERIFIER);
        const res = await UserApi.delete([user1.id], token);
        const { errors, errorCode } = res.body;
        expect(res.status).toBe(401);
        expect(errorCode).toEqual('AUTH004');
        expect(errors[0]).toMatch(/Access denied/i);
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block ',
      TestService.testCatchBlock(UserController.deleteUsers)
    );
  });
});
