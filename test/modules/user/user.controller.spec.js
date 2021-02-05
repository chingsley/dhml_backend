import TestService from '../app/app.test.service';
import TestStaff from '../staff/staff.test.services';
import faker from 'faker';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import ROLES from '../../../src/shared/constants/roles.constants';
import nodemailer from 'nodemailer';
import TestUser from './user.test.services';

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
      const seededStaff = await TestStaff.seedOne(stff[1]);
      const role = await TestService.createRole(ROLES.DEPT_USER);
      const user = {
        staffId: seededStaff.id,
        email: seededStaff.email,
        username: faker.internet.userName(seededStaff.firstName),
        roleId: role.id,
      };
      const data = await TestService.getToken(stff[0], ROLES.SUPERADMIN);
      token = data.token;
      res = await TestUser.register(user, token);
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
        // const { data } = res.body;
        // const userPassword = await TestService.getPasswordByUserId(data.userId);
        expect(userPassword.isDefaultValue).toBe(true);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('sets the default password to expire in 24 hours', async (done) => {
      try {
        // const { data } = res.body;
        // const { defaultPasswordExpiry: date2 } = data;
        const date2 = userPassword.expiryDate;
        const timestamp = new Date(date2) - new Date();
        const hours = timestamp / (60 * 60 * 1000);
        expect(hours).toBeCloseTo(24);
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
