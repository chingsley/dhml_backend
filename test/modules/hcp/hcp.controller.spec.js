/* eslint-disable jest/expect-expect */
import TestService from '../app/app.test.service';
import getSampleHCPs from '../../../src/shared/samples/hcp.samples';
import ROLES from '../../../src/shared/constants/roles.constants';
import nodemailer from 'nodemailer';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import HcpApi from './hcp.test.api';
import AuthApi from '../auth/auth.test.api';
import NanoId from '../../../src/utils/NanoId';
import HcpController from '../../../src/modules/hcp/hcp.controller';
import _HcpService from './hcp.test.service';

describe('HcpController', () => {
  let hcpSample;
  const nodemailerOriginalImplementation = nodemailer.createTransport;
  const originalNanoIdGetValue = NanoId.getValue;
  const SAMPLE_PASSWORD = 'Testing*123';
  beforeAll(() => {
    nodemailer.createTransport = jest.fn().mockReturnValue({
      sendMail: jest.fn().mockReturnValue({ status: 200 }),
    });
    NanoId.getValue = jest.fn().mockReturnValue(SAMPLE_PASSWORD);
  });
  afterAll(() => {
    nodemailer.createTransport = nodemailerOriginalImplementation;
    NanoId.getValue = originalNanoIdGetValue;
  });
  describe('addNewHcp', () => {
    let token, res, hcpPassword;
    beforeAll(async () => {
      await TestService.resetDB();
      const sampleHCPs = getSampleHCPs(1);
      await TestService.createRole(ROLES.HCP);
      hcpSample = {
        ...sampleHCPs[0],
        // roleId: role.id,
      };
      const { sampleStaffs: stff } = getSampleStaffs(1);
      const data = await TestService.getToken(stff[0], ROLES.SUPERADMIN);
      token = data.token;
      res = await HcpApi.register(hcpSample, token);
      const { data: registeredHcp } = res.body;
      hcpPassword = await TestService.getPasswordByHcpId(registeredHcp.id);
    });
    it('returns status 201 with success message on successful registration', async (done) => {
      try {
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('data');
        expect(true).toBe(true);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('sets the hcp"s statu to "active" by default', async (done) => {
      try {
        const { data } = res.body;
        expect(data.status).toBe('active');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('ensures the hcp has password with "isDefaultValue" set to true', async (done) => {
      try {
        expect(hcpPassword.isDefaultValue).toBe(true);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('sets the default password to expire in 24 hours', async (done) => {
      try {
        const date2 = hcpPassword.expiryDate;
        const timestamp = new Date(date2) - new Date();
        const hours = timestamp / (60 * 60 * 1000);
        expect(hours).toBeCloseTo(24);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('ensures the hcp can login with the new password', async (done) => {
      try {
        const { code } = hcpSample;
        const res = await AuthApi.login({
          username: code,
          password: SAMPLE_PASSWORD,
          userType: 'hcp',
        });
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'login successful');
        expect(data).toHaveProperty('hcp');
        expect(data).toHaveProperty('token');
        expect(data.hcp.code).toEqual(code);
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(HcpController.addNewHcp)
    );
  });
  describe('updateHcp', () => {
    let token, res, hcp1, hcp2;
    const changes = { email: 'newmail@gmail.com' };
    beforeAll(async () => {
      await TestService.resetDB();
      const HCPs = await TestService.seedHCPs(2);
      hcp1 = HCPs[0];
      hcp2 = HCPs[1];
      const { sampleStaffs: stff } = getSampleStaffs(1);
      const data = await TestService.getToken(stff[0], ROLES.SUPERADMIN);
      token = data.token;
      res = await HcpApi.update(hcp1.id, changes, token);
    });
    it('returns a success message with status 200', async (done) => {
      try {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns the updated record in the response data', async (done) => {
      try {
        const { data } = res.body;
        expect(data.email).toEqual(changes.email);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('saves the new changes in the database', async (done) => {
      try {
        const updatedHcp = await _HcpService.findById(hcp1.id);
        expect(updatedHcp.email).toEqual(changes.email);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('allows same record update with same unique value', async (done) => {
      try {
        const changes = { email: hcp1.email };
        const res = await HcpApi.update(hcp1.id, changes, token);
        expect(res.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('detects duplicate violation during update', async (done) => {
      try {
        const changes = { email: hcp2.email };
        const res = await HcpApi.update(hcp1.id, changes, token);
        const { errors } = res.body;
        expect(res.status).toBe(400);
        expect(errors[0]).toMatch(/already exists/i);
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(HcpController.updateHcp)
    );
  });
});
