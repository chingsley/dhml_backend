/* eslint-disable jest/expect-expect */
import TestService from '../app/app.test.service';
import _StaffService from '../staff/staff.test.services';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import ROLES from '../../../src/shared/constants/roles.constants';
import nodemailer from 'nodemailer';
import StaffApi from './staff.test.api';
import StaffController from '../../../src/modules/staff/staff.controller';
import { staffSearchableFields } from '../../../src/shared/attributes/staff.attributes';
import { moment } from '../../../src/utils/timers';

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
      const { sampleStaffs: stffs } = getSampleStaffs(3);
      const data = await TestService.getToken(stffs[0], ROLES.SUPERADMIN);
      token = data.token;
      newStaff = stffs[1];
      thirdStaff = stffs[2];
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
  describe('updateStaff', () => {
    let token, res, stff1, stff2;
    const changes = {
      email: 'newmail@gmail.com',
      surname: 'anyinwa',
      firstName: 'mua',
    };
    beforeAll(async () => {
      await TestService.resetDB();
      const { sampleStaffs: stffs } = getSampleStaffs(3);
      [stff1, stff2] = await _StaffService.seedBulk(stffs.slice(1, 3));
      const data = await TestService.getToken(stffs[0], ROLES.SUPERADMIN);
      token = data.token;
      res = await StaffApi.update(stff1.id, changes, token);
    });
    it('successfully updates staff data', async (done) => {
      try {
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(data).toEqual(
          expect.objectContaining({
            email: changes.email,
            surname: changes.surname,
            firstName: changes.firstName,
          })
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('saves the update in the database', async (done) => {
      try {
        const updatedStff1 = await _StaffService.findOneWhere({ id: stff1.id });
        expect(updatedStff1).toEqual(
          expect.objectContaining({
            email: changes.email,
            surname: changes.surname,
            firstName: changes.firstName,
          })
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('allows same record update of unique fields with same value', async (done) => {
      try {
        const changes = {
          email: stff1.email,
          accountNumber: stff1.accountNumber,
        };
        const res = await StaffApi.update(stff1.id, changes, token);
        expect(res.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('detects unique violation during update', async (done) => {
      try {
        const uniqueFields = ['email', 'accountNumber'];
        for (let field of uniqueFields) {
          const changes = { [field]: stff2[field] };
          const res = await StaffApi.update(stff1.id, changes, token);
          const { errors } = res.body;
          expect(res.status).toBe(400);
          expect(errors[0]).toMatch(/already exists/i);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block ',
      TestService.testCatchBlock(StaffController.updateStaff)
    );
  });
  describe('getAllStaffs', () => {
    let token, seededStaffs;
    beforeAll(async () => {
      await TestService.resetDB();
      const { sampleStaffs: stffs } = getSampleStaffs(20);
      seededStaffs = await _StaffService.seedBulk(stffs);
      const data = await TestService.getToken(stffs[0], ROLES.SUPERADMIN);
      token = data.token;
    });
    it('returns all the records in teh db', async (done) => {
      try {
        const res = await StaffApi.getAll('', token);
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(data.count).toEqual(seededStaffs.length);
        expect(data.rows).toHaveLength(seededStaffs.length);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can paginate the record', async (done) => {
      try {
        const page = 0;
        const pageSize = 3;
        const res = await StaffApi.getAll(
          `pageSize=${pageSize}&page=${page}`,
          token
        );
        const { data } = res.body;
        expect(data.count).toEqual(seededStaffs.length);
        expect(data.rows).toHaveLength(pageSize);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can filter the record by several fields', async (done) => {
      try {
        const subject = seededStaffs[0];
        for (let field of staffSearchableFields) {
          let searchValue = subject[field.name];
          const searchFiled = field.name;
          if (field.type === 'date') {
            searchValue = moment(searchValue).format('YYYY-MM-DD');
          }
          const res = await StaffApi.getAll(
            `searchField=${searchFiled}&searchValue=${searchValue}`,
            token
          );
          const {
            data: { rows },
          } = res.body;
          for (let staff of rows) {
            if (field.type === 'date') {
              expect(moment(staff[searchFiled]).format('YYYY-MM-DD')).toBe(
                searchValue
              );
            } else {
              expect(staff[searchFiled]).toBe(searchValue);
            }
          }
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block ',
      TestService.testCatchBlock(StaffController.getAllStaff)
    );
  });
});
