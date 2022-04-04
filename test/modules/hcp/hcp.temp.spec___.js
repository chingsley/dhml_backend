/* eslint-disable jest/expect-expect */
import sgMail from '@sendgrid/mail';
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
import getEnrollees from '../../../src/shared/samples/enrollee.samples';
import _StaffService from '../staff/staff.test.services';
import { MAX_STAFF_COUNT } from '../../../src/shared/constants/seeders.constants';
import HcpSpecialityService from './hcp.speciality.test.services';

describe('getAllHcp', () => {
  const sgMailOriginalImplementation = sgMail.send;
  const nodemailerOriginalImplementation = nodemailer.createTransport;
  const originalNanoIdGetValue = NanoId.getValue;
  const SAMPLE_PASSWORD = 'Testing*123';
  beforeAll(() => {
    sgMail.send = jest.fn().mockReturnValue({ status: 200 });
    nodemailer.createTransport = jest.fn().mockReturnValue({
      sendMail: jest.fn().mockReturnValue({ status: 200 }),
    });
    NanoId.getValue = jest.fn().mockReturnValue(SAMPLE_PASSWORD);
  });
  afterAll(() => {
    nodemailer.createTransport = nodemailerOriginalImplementation;
    sgMail.send = sgMailOriginalImplementation;
    NanoId.getValue = originalNanoIdGetValue;
  });

  let token, seededHCPs, seededHcpSpecialties, defaultRes, hcpWithoutSpecialties, hcpWithSpecialties;
  const COUNT_HCP = 20;
  beforeAll(async () => {
    await TestService.resetDB();
    const hcps = getSampleHCPs();

    seededHCPs = await _HcpService.bulkInsert([
      ...hcps.slice(0, 10),
      ...hcps.slice(hcps.length - 10).map((hcp) => ({
        ...hcp,
        status: 'suspended',
      })),
    ]);

    [hcpWithoutSpecialties, ...hcpWithSpecialties] = seededHCPs;
    seededHcpSpecialties = await HcpSpecialityService.seedRandomHcpSpecialties(hcpWithSpecialties);
    const { sampleStaffs: stff } = getSampleStaffs(1);
    const data = await TestService.getToken(stff[0], ROLES.SUPERADMIN);
    token = data.token;
    defaultRes = await HcpApi.getAll('', token);
  });
  it('returns status 200 and the total record in the db', async (done) => {
    try {
      const res = defaultRes;
      const { data } = res.body;
      expect(res.status).toBe(200);
      expect(data.count).toEqual(COUNT_HCP);
      done();
    } catch (e) {
      done(e);
    }
  });
  it('returns hcps that have specialties along with their specialties', async (done) => {
    try {
      const res = defaultRes;
      const { data } = res.body;
      const withSpecialties = data.rows.filter(hcp => hcp.specialties.length > 0);
      expect(withSpecialties.length).toBeGreaterThan(0);

      withSpecialties.forEach((hcp) => {
        hcp.specialties.forEach(specialty => {
          expect(specialty).toStrictEqual(
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
            }),
          );
        });
      });
      done();
    } catch (e) {
      done(e);
    }
  });
  it('also returns hcps that have no spcialties', async (done) => {
    try {
      const res = defaultRes;
      const { data } = res.body;
      const noSpecialtyHcp = data.rows.find(hcp => hcp.id === hcpWithoutSpecialties.id);
      expect(noSpecialtyHcp.specialties).toHaveLength(0);
      done();
    } catch (e) {
      done(e);
    }
  });
  it('can filter the hcp"s by specialtyId', async (done) => {
    try {
      const specialtyId = seededHcpSpecialties[0].specialtyId;
      const query = `specialtyId=${specialtyId}`;
      const res = await HcpApi.getAll(query, token);
      const { data } = res.body;
      data.rows.forEach(hcp => {
        hcp.specialties.forEach(specialty => {
          expect(specialty.id).toEqual(specialtyId);
        });
      });
      done();
    } catch (e) {
      done(e);
    }
  });
  it('can paginate the response data', async (done) => {
    try {
      const PAGE_SIZE = 3;
      const query = `pageSize=${PAGE_SIZE}&page=0`;
      const res = await HcpApi.getAll(query, token);
      const { data } = res.body;
      expect(res.status).toBe(200);
      expect(data.count).toEqual(COUNT_HCP);
      expect(data.rows).toHaveLength(PAGE_SIZE);
      done();
    } catch (e) {
      done(e);
    }
  });
  it('can filter the record by hcp status', async (done) => {
    try {
      const STATUS = 'suspended';
      const query = `searchField=status&searchValue=${STATUS}`;
      const res = await HcpApi.getAll(query, token);
      const { data } = res.body;
      for (let { status } of data.rows) {
        expect(status).toBe(STATUS);
      }
      done();
    } catch (e) {
      done(e);
    }
  });
  it('can filter the record by category', async (done) => {
    try {
      const CATEGORY = 'secondary';
      const query = `searchField=category&searchValue=${CATEGORY}`;
      const res = await HcpApi.getAll(query, token);
      const { data } = res.body;
      for (let { category } of data.rows) {
        expect(category.toLowerCase()).toBe(CATEGORY);
      }
      done();
    } catch (e) {
      done(e);
    }
  });
  it('can filter the record by state', async (done) => {
    try {
      const STATE = seededHCPs[0].state;
      const query = `searchField=state&searchValue=${STATE}`;
      const res = await HcpApi.getAll(query, token);
      const { data } = res.body;
      for (let { state } of data.rows) {
        expect(state).toMatch(new RegExp(STATE, 'i'));
      }
      done();
    } catch (e) {
      done(e);
    }
  });
  it('can search the record by any value', async (done) => {
    try {
      const SEARCH_ITEM = seededHCPs[0].email;
      const query = `searchItem=${SEARCH_ITEM}`;
      const res = await HcpApi.getAll(query, token);
      const { data } = res.body;
      for (let { email } of data.rows) {
        expect(email).toMatch(new RegExp(SEARCH_ITEM, 'i'));
      }
      done();
    } catch (e) {
      done(e);
    }
  });
  it('can match the record by id, code, name to return specific hcp', async (done) => {
    try {
      const queries = {
        id: seededHCPs[0].id,
        code: seededHCPs[1].code,
        email: seededHCPs[2].email,
      };
      for (let [key, value] of Object.entries(queries)) {
        const query = `${key}=${value}`;
        const res = await HcpApi.getAll(query, token);
        const { rows, count } = res.body.data;
        expect(count).toEqual(1);
        expect(rows[0][key]).toEqual(value);
      }
      done();
    } catch (e) {
      done(e);
    }
  });
  it(
    'it catches errors thrown in the try block',
    TestService.testCatchBlock(HcpController.getAllHcp)
  );
});