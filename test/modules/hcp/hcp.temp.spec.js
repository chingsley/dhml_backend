import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import nodemailer from 'nodemailer';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import HcpApi from './hcp.test.api';
import NanoId from '../../../src/utils/NanoId';
import _HcpService from './hcp.test.service';
import getEnrollees from '../../../src/shared/samples/enrollee.samples';

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
  describe('deleteHcp', () => {
    let token, hcp1, hcp2, res;
    beforeAll(async () => {
      await TestService.resetDB();
      [hcp1, hcp2] = await TestService.seedHCPs(2);
      const { principals } = getEnrollees({ numOfPrincipals: 1 });
      await TestService.seedEnrollees([
        {
          ...principals[0],
          scheme: 'AFRSHIP',
          enrolmentType: 'principal',
          hcpId: hcp2.id,
          isVerified: true,
        },
      ]);

      const { sampleStaffs: stff } = getSampleStaffs(1);
      const data = await TestService.getToken(stff[0], ROLES.SUPERADMIN);
      token = data.token;
      res = await HcpApi.delete(hcp1.id, token);
    });
    it('returns status 200 and a success message', async (done) => {
      try {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'HCP has been deleted');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('removes the record from the database', async (done) => {
      try {
        const hcp = await _HcpService.findById(hcp1.id);
        expect(hcp).toBe(null);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('rejects attempt to delete an HCP that has enrolleess', async (done) => {
      try {
        const res = await HcpApi.delete(hcp2.id, token);
        const { errors } = res.body;
        const expectedError = 'cannot delete hcp with enrolleess';
        expect(errors[0]).toEqual(expectedError);
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
