import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import nodemailer from 'nodemailer';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import HcpApi from './hcp.test.api';
import NanoId from '../../../src/utils/NanoId';
import _HcpService from './hcp.test.service';

describe('HcpTemp', () => {
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
  });
});
