/* eslint-disable jest/expect-expect */
import TestService from '../app/app.test.service';
import _StaffService from '../staff/staff.test.services';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import ROLES from '../../../src/shared/constants/roles.constants';
import nodemailer from 'nodemailer';
import StaffApi from './staff.test.api';
import StaffController from '../../../src/modules/staff/staff.controller';

describe('StaffController', () => {
  const nodemailerOriginalImplementation = nodemailer.createTransport;
  beforeAll(() => {
    nodemailer.createTransport = jest.fn().mockReturnValue({
      sendMail: jest.fn().mockReturnValue({ status: 200 }),
    });
  });
  afterAll(() => {
    nodemailer.createTransport = nodemailerOriginalImplementation;
  });
  describe('addNewStaff', () => {
    let token, res, newStaff, thirdStaff;
    beforeAll(async () => {
      await TestService.resetDB();
      const { sampleStaffs: stff } = getSampleStaffs(3);
      const data = await TestService.getToken(stff[0], ROLES.SUPERADMIN);
      token = data.token;
      newStaff = stff[1];
      thirdStaff = stff[2];
      res = await StaffApi.register(newStaff, token);
    });

    it('returns status 201 with success message on successful registration', async (done) => {
      try {
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('data');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns the newly added staff in the response data', async (done) => {
      try {
        const { data } = res.body;
        expect(data).toEqual(
          expect.objectContaining({
            staffIdNo: newStaff.staffIdNo,
            staffFileNo: newStaff.staffFileNo,
            surname: newStaff.surname,
            email: newStaff.email,
          })
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('saves the record in the database', async (done) => {
      try {
        const { staffIdNo, email } = newStaff;
        const staff = await _StaffService.findOneWhere({ staffIdNo });
        expect(staff.email).toEqual(email);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('detects violation of unique constraints', async (done) => {
      try {
        const uniqueValues = [
          'staffIdNo',
          'staffFileNo',
          'email',
          'accountNumber',
        ];
        for (let uniqueValue of uniqueValues) {
          const res = await StaffApi.register(
            {
              ...thirdStaff,
              [uniqueValue]: newStaff[uniqueValue],
            },
            token
          );
          const { errors } = res.body;
          expect(errors[0]).toMatch(/already exists/i);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block ',
      TestService.testCatchBlock(StaffController.addNewStaff)
    );
  });
});
