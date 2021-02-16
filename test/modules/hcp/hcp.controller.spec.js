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
import getEnrollees from '../../../src/shared/samples/enrollee.samples';
import _StaffService from '../staff/staff.test.services';
import { MAX_STAFF_COUNT } from '../../../src/shared/constants/seeders.constants';
// import { dateOnly, months } from '../../../src/utils/timers';

const { log } = console;

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
      hcpSample = sampleHCPs[0];
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
        res.status !== 400 && log(res.body);
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
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(HcpController.changeHcpStatus)
    );
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
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(HcpController.deleteHcp)
    );
  });
  describe('getAllHcp', () => {
    let token, seededHCPs;
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
      const { sampleStaffs: stff } = getSampleStaffs(1);
      const data = await TestService.getToken(stff[0], ROLES.SUPERADMIN);
      token = data.token;
    });
    it('returns status 200 and the total record in the db', async (done) => {
      try {
        const res = await HcpApi.getAll('', token);
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(data.count).toEqual(COUNT_HCP);
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
    it('can search the record by any vaue', async (done) => {
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
  describe('manifest/capitation', () => {
    let token, seededHCPs, primaryHcpNoEnrollee, res1, res2, res3, res4;
    const NUM_ACTIVE_HCP = 15;
    const NUM_SUSPENDED_HCP = 5;
    const TOTAL_COUNT_HCP = NUM_ACTIVE_HCP + NUM_SUSPENDED_HCP;
    const LIVES_PER_HCP = 5;
    const PER_UNIT_CHARGE = 750;

    beforeAll(async () => {
      await TestService.resetDB();
      const allHCPs = getSampleHCPs();
      const primaryHCPs = allHCPs
        .filter((h) => h.category.match(/primary/i))
        .slice(0, Math.floor(TOTAL_COUNT_HCP / 2));
      primaryHcpNoEnrollee = allHCPs
        .filter((h) => h.category.match(/primary/i))
        .slice(
          Math.floor(TOTAL_COUNT_HCP / 2),
          Math.floor(TOTAL_COUNT_HCP / 2) + 1
        );
      const secondaryActiveHCPs = allHCPs
        .filter((h) => h.category.match(/secondary/i))
        .slice(0, Math.ceil(TOTAL_COUNT_HCP / 2));
      const secondarySuspendedHCPs = secondaryActiveHCPs
        .splice(0, NUM_SUSPENDED_HCP)
        .map((hcp) => ({
          ...hcp,
          status: 'suspended',
        }));
      seededHCPs = await _HcpService.bulkInsert([
        ...primaryHCPs,
        ...secondaryActiveHCPs,
        ...secondarySuspendedHCPs,
        ...primaryHcpNoEnrollee,
      ]);
      const { sampleStaffs: stff } = getSampleStaffs(MAX_STAFF_COUNT);
      const seededStaffs = await _StaffService.seedBulk(stff);
      const { principals, dependants } = getEnrollees({
        numOfPrincipals: TOTAL_COUNT_HCP,
        sameSchemeDepPerPrincipal: 3,
        vcshipDepPerPrincipal: 1,
      });
      const seededPrincipals = await TestService.seedEnrollees(
        principals.map((p, i) => {
          return {
            ...p,
            hcpId: seededHCPs[i].id,
            staffNumber: p.staffNumber ? seededStaffs[i].staffIdNo : null,
          };
        })
      );
      const dependantsWithPrincipalId = dependants.reduce((acc, dep, i) => {
        const hcpId = seededHCPs[i % TOTAL_COUNT_HCP].id;
        for (let { enrolleeIdNo, id } of seededPrincipals) {
          if (dep.enrolleeIdNo.match(new RegExp(`${enrolleeIdNo}-`))) {
            acc.push({ ...dep, principalId: id, hcpId });
          }
        }
        return acc;
      }, []);
      await TestService.seedEnrollees(dependantsWithPrincipalId);
      const data = await TestService.getToken(stff[0], ROLES.SUPERADMIN);
      token = data.token;
      res1 = await HcpApi.getManifest('', token);
      res2 = await HcpApi.getCapitation('', token);
      res3 = await HcpApi.printCapitationSummary('', token);
      res4 = await HcpApi.downloadHcpManifest(seededHCPs[0].id, token);
    });

    it('returns status 200 and the total record in the db', async (done) => {
      try {
        expect(res1.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });

    it('returns manifest for all active hcp in the system', async (done) => {
      try {
        const { data } = res1.body;
        const totalActiveHcp = await _HcpService.countActive();
        expect(data.count).toEqual(totalActiveHcp);
        expect(data.rows).toHaveLength(totalActiveHcp);
        done();
      } catch (e) {
        done(e);
      }
    });

    it('returns the sum of lives in the manifest', async (done) => {
      try {
        const {
          data: {
            total: { lives, principals, dependants },
          },
        } = res1.body;
        expect(lives).toEqual(LIVES_PER_HCP * NUM_ACTIVE_HCP);
        expect(principals + dependants).toEqual(LIVES_PER_HCP * NUM_ACTIVE_HCP);
        done();
      } catch (e) {
        done(e);
      }
    });

    // it('can filter the manifest by date to return previous manifests on a monthly basis', async (done) => {
    //   try {
    //     const res = await HcpApi.getManifest(
    //       `date=${months.setPast(1)}`,
    //       token
    //     );
    //     const { data } = res.body;
    //     for (let hcp of data.rows) {
    //       expect(dateOnly(hcp.monthOfYear).slice(0, 7)).toBe(
    //         months.setPast(1).slice(0, 7)
    //       );
    //     }
    //     done();
    //   } catch (e) {
    //     done(e);
    //   }
    // });

    it('computes the capitation for all active HCPs', async (done) => {
      try {
        const {
          data: { total: manifestTotal },
        } = res1.body;
        const {
          data: { total: capitationTotal },
        } = res2.body;
        expect(`${capitationTotal.lives}`).toBe(`${manifestTotal.lives}`);
        done();
      } catch (e) {
        done(e);
      }
    });

    it('computes the total amount to be paid for each hcp', async (done) => {
      try {
        const { data } = res2.body;
        for (let hcp of data.rows) {
          expect(`${Number(hcp.lives) * PER_UNIT_CHARGE}`).toEqual(
            `${hcp.amount}`
          );
        }
        done();
      } catch (e) {
        done(e);
      }
    });

    it('ensures the total amount coputed from manifest matches the total in capitation', async (done) => {
      try {
        const { data: manifestData } = res1.body;
        const totalAmtFromManifest = manifestData.rows.reduce((acc, hcp) => {
          acc +=
            (Number(hcp.principals) + Number(hcp.dependants)) * PER_UNIT_CHARGE;
          return acc;
        }, 0);
        const {
          data: {
            total: { amount: capitationTotalAmnt },
          },
        } = res2.body;
        expect(`${totalAmtFromManifest}`).toBe(`${capitationTotalAmnt}`);
        done();
      } catch (e) {
        done(e);
      }
    });

    // it('can filter the capitation by date to return previous capitation on a monthly basis', async (done) => {
    //   try {
    //     const res = await HcpApi.getCapitation(
    //       `date=${months.setPast(1)}`,
    //       token
    //     );
    //     const { data } = res.body;
    //     for (let hcp of data.rows) {
    //       expect(dateOnly(hcp.monthOfYear).slice(0, 7)).toBe(
    //         months.setPast(1).slice(0, 7)
    //       );
    //     }
    //     done();
    //   } catch (e) {
    //     done(e);
    //   }
    // });

    it('can returns zero manifest for HCPs that do not have enrollees', async (done) => {
      try {
        const searchItem = primaryHcpNoEnrollee[0].code;
        const res = await HcpApi.getManifest(`searchItem=${searchItem}`, token);
        const { data } = res.body;
        for (let hcp of data.rows) {
          expect(hcp.hcpCode).toEqual(searchItem);
          expect(hcp.lives).toEqual('0');
          expect(hcp.principals).toEqual('0');
          expect(hcp.dependants).toEqual('0');
        }
        done();
      } catch (e) {
        done(e);
      }
    });

    it('can returns empty rows for HCPs that do not have enrollees', async (done) => {
      try {
        const searchItem = primaryHcpNoEnrollee[0].code;
        const res = await HcpApi.getCapitation(
          `searchItem=${searchItem}`,
          token
        );
        const { data } = res.body;
        expect(data.total.lives).toBe(null);
        expect(data.total.amount).toBe(null);
        expect(data.rows).toHaveLength(0);
        done();
      } catch (e) {
        done(e);
      }
    });

    it('can get the captitation summary', async (done) => {
      try {
        const { data } = res3.body;
        const { count, total } = data;
        expect(count).toEqual(NUM_ACTIVE_HCP);
        expect(Number(total.lives)).toEqual(
          Number(NUM_ACTIVE_HCP * LIVES_PER_HCP)
        );
        expect(total.amount).toEqual(res2.body.data.total.amount);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns status 200 on successful download of manifest', async (done) => {
      try {
        expect(res4.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block of getManifest',
      TestService.testCatchBlock(HcpController.getManifest)
    );
    it(
      'it catches errors thrown in the try block of getCapitation',
      TestService.testCatchBlock(HcpController.getCapitation)
    );
    it(
      'it catches errors thrown in the try block of printCapitationSummary',
      TestService.testCatchBlock(HcpController.printCapitationSummary)
    );
    it(
      'it catches errors thrown in the try block of downloadHcpManifest',
      TestService.testCatchBlock(HcpController.downloadHcpManifest)
    );
  });
});
