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
  describe('changeStatus', () => {
    let token, HCPs, hcpIds;
    beforeAll(async () => {
      await TestService.resetDB();
      HCPs = await TestService.seedHCPs(2);
      hcpIds = HCPs.map(({ dataValues: { id } }) => id);

      const { sampleStaffs: stff } = getSampleStaffs(1);
      const data = await TestService.getToken(stff[0], ROLES.SUPERADMIN);
      token = data.token;
    });
    it('ensures the HCPs have inital status "active"', async (done) => {
      try {
        const allActive = HCPs.every((hcp) => hcp.status === 'active');
        expect(allActive).toBe(true);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can change status of multiple HCPs to suspended', async (done) => {
      try {
        const STATUS = 'suspended';
        const payload = { status: STATUS, hcpIds };
        const res = await HcpApi.changeStatus(payload, token);
        const updatedHcps = await _HcpService.findByIdArr(hcpIds);
        expect(res.status).toBe(200);
        for (let { status } of updatedHcps) {
          expect(status).toEqual(STATUS);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can change status of multiple HCPs to active', async (done) => {
      try {
        const STATUS = 'active';
        const payload = { status: STATUS, hcpIds };
        const res = await HcpApi.changeStatus(payload, token);
        const updatedHcps = await _HcpService.findByIdArr(hcpIds);
        expect(res.status).toBe(200);
        for (let { status } of updatedHcps) {
          expect(status).toEqual(STATUS);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
