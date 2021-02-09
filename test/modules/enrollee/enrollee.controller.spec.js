/* eslint-disable jest/expect-expect */
import { v2 as cloudinary } from 'cloudinary';
import { dateOnly, days } from '../../../src/utils/timers';
import faker from 'faker';

import getEnrollees from '../../../src/shared/samples/enrollee.samples';
import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import EnrolleeTest from './enrollee.test.service';
import TestStaff from '../staff/staff.test.services';
import { zeroPadding } from '../../../src/utils/helpers';
import EnrolleeApi from './enrollee.test.api';
import EnrolleeController from '../../../src/modules/enrollee/enrollee.controller';

const { log } = console;

const originalImplementation = cloudinary.uploader.upload;
const SAMPLE_IMG_URL = faker.image.imageUrl();

describe('EnrolleeController', () => {
  beforeAll(() => {
    cloudinary.uploader.upload = jest
      .fn()
      .mockReturnValue({ url: SAMPLE_IMG_URL });
  });
  afterAll(() => {
    cloudinary.uploader.upload = originalImplementation;
  });
  describe('addNewEnrollee', () => {
    let sampleEnrollees,
      token,
      hcp,
      afrshipPrincipal,
      dsshipPrincipal,
      vcshipPrincipal,
      specialPrincipal;
    beforeAll(async () => {
      await TestService.resetDB();
      const HCPs = await TestService.seedHCPs(1);
      hcp = HCPs[0];

      sampleEnrollees = getEnrollees({
        numOfPrincipals: 4,
        sameSchemeDepPerPrincipal: 1,
        vcshipDepPerPrincipal: 1,
      });
      const principals = TestService.removeNullValues(
        sampleEnrollees.principals
      );
      afrshipPrincipal = {
        ...principals[0],
        scheme: 'AFRSHIP',
        enrolmentType: 'principal',
        hcpId: hcp.id,
      };
      dsshipPrincipal = {
        ...principals[1],
        scheme: 'DSSHIP',
        enrolmentType: 'principal',
        hcpId: hcp.id,
      };
      vcshipPrincipal = {
        ...principals[2],
        scheme: 'VCSHIP',
        enrolmentType: 'principal',
        hcpId: hcp.id,
      };
      specialPrincipal = {
        ...principals[3],
        scheme: 'AFRSHIP',
        enrolmentType: 'special-principal',
        staffNumber: undefined,
        rank: 'General',
        armOfService: 'army',
        hcpId: hcp.id,
      };
      specialPrincipal.serviceNumber =
        specialPrincipal.serviceNumber || 'SN/001/SP';
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.ENROLMENT_OFFICER
      );
      token = data.token;
    });

    it('can enrol an afrship principal', async (done) => {
      try {
        const res = await EnrolleeTest.enrol(afrshipPrincipal, token, {
          withUploads: true,
        });

        res.status !== 201 && log(res.body);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('data');
        const { data } = res.body;
        expect(data).toEqual(
          expect.objectContaining({
            enrolleeIdNo: zeroPadding(231),
            isPrincipal: true,
            scheme: afrshipPrincipal.scheme,
          })
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can enrol a dsship principal', async (done) => {
      try {
        const staff = await TestStaff.seedOne();
        const res = await EnrolleeTest.enrol(
          { ...dsshipPrincipal, staffNumber: staff.staffIdNo },
          token
        );
        res.status !== 201 && log(res.body);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('data');
        const { data } = res.body;
        expect(data).toEqual(
          expect.objectContaining({
            isPrincipal: true,
            scheme: dsshipPrincipal.scheme,
          })
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can enrol a vcship principal', async (done) => {
      try {
        const res = await EnrolleeTest.enrol(vcshipPrincipal, token);
        res.status !== 201 && log(res.body);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('data');
        const { data } = res.body;
        expect(data).toEqual(
          expect.objectContaining({
            isPrincipal: true,
            scheme: vcshipPrincipal.scheme,
          })
        );
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can enrol a special principal', async (done) => {
      try {
        const enrolleeIdNo = '1';
        const serviceNumbers = ['A/001/SP', 'A/002/SP'];
        for (let i = 0; i < 2; i++) {
          const res = await EnrolleeTest.enrol(
            {
              ...specialPrincipal,
              enrolleeIdNo,
              serviceNumber: serviceNumbers[i],
            },
            token
          );
          if (i < 1) {
            res.status !== 201 && log(res.body);
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('data');
            const { data } = res.body;
            expect(data).toEqual(
              expect.objectContaining({
                enrolleeIdNo: zeroPadding(enrolleeIdNo),
                isPrincipal: true,
                scheme: specialPrincipal.scheme,
              })
            );
          } else {
            res.status !== 400 && log(res.body);
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
          }
        }

        done();
      } catch (e) {
        done(e);
      }
    });
    it('can enrol afrship dependants', async (done) => {
      try {
        const { dependants } = sampleEnrollees;
        const principal = await TestService.findAfrshipPrincipal({
          hcpId: hcp.id,
        });
        const dependant = TestService.removeUnwantedFields(dependants[0]);
        for (let i = 0; i < 6; i++) {
          const res = await EnrolleeTest.enrol(
            {
              ...dependant,
              enrolmentType: 'dependant',
              relationshipToPrincipal: 'child',
              principalId: principal.enrolleeIdNo,
              scheme: principal.scheme,
              hcpId: hcp.id,
            },
            token
          );
          if (i < 5) {
            res.status !== 201 && log(res.body);
            expect(res.status).toBe(201);
            const { data } = res.body;
            const { enrolleeIdNo } = data;
            const expected = `${principal.enrolleeIdNo}-${i + 1}`;
            expect(enrolleeIdNo).toEqual(expected);
          } else {
            res.status !== 400 && log(res.body);
            const { errors } = res.body;
            const { firstName, surname, scheme } = principal;
            const expectedError = `The principal, ${firstName} ${surname}, has reached the limit(5) of allowed dependants under ${scheme.toUpperCase()}`;
            expect(errors[0]).toEqual(expectedError);
          }
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can enrol dsship dependants', async (done) => {
      try {
        const { dependants } = sampleEnrollees;
        const principal = await TestService.findDsshipPrincipal({
          hcpId: hcp.id,
        });
        const dependant = TestService.removeUnwantedFields(dependants[0]);
        for (let i = 0; i < 6; i++) {
          const res = await EnrolleeTest.enrol(
            {
              ...dependant,
              enrolmentType: 'dependant',
              relationshipToPrincipal: 'child',
              principalId: principal.enrolleeIdNo,
              scheme: principal.scheme,
              hcpId: hcp.id,
            },
            token
          );
          if (i < 5) {
            res.status !== 201 && log(res.body);
            expect(res.status).toBe(201);
            const { data } = res.body;
            const { enrolleeIdNo } = data;
            const expected = `${principal.enrolleeIdNo}-${i + 1}`;
            expect(enrolleeIdNo).toEqual(expected);
          } else {
            res.status !== 400 && log(res.body);
            const { errors } = res.body;
            const { firstName, surname, scheme } = principal;
            const expectedError = `The principal, ${firstName} ${surname}, has reached the limit(5) of allowed dependants under ${scheme.toUpperCase()}`;
            expect(errors[0]).toEqual(expectedError);
          }
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can enrol vcship dependants of more than 5 in number', async (done) => {
      try {
        const { dependants } = sampleEnrollees;
        const serviceNumber = await TestService.getUniqueValue();
        const principal = await TestService.getRegisteredPrincipal({
          scheme: 'vcship',
          withValues: {
            hcpId: hcp.id,
            serviceNumber,
          },
        });
        const dependant = TestService.removeUnwantedFields(dependants[0]);
        for (let i = 0; i < 6; i++) {
          const res = await EnrolleeTest.enrol(
            {
              ...dependant,
              enrolmentType: 'dependant',
              relationshipToPrincipal: 'child',
              principalId: principal.enrolleeIdNo,
              scheme: principal.scheme,
              hcpId: hcp.id,
            },
            token
          );
          res.status !== 201 && log(res.body);
          expect(res.status).toBe(201);
          const { data } = res.body;
          const { enrolleeIdNo } = data;
          const expected = `${principal.enrolleeIdNo}-${i + 1}`;
          expect(enrolleeIdNo).toEqual(expected);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(EnrolleeController.addNewEnrollee)
    );
  });
  describe('updateEnrollee', () => {
    let sampleEnrollees, token, hcp, samplePrncpl1, samplePrncpl2;
    let principal1, principal2, p2Dependants;

    beforeAll(async () => {
      await TestService.resetDB();
      const HCPs = await TestService.seedHCPs(1);
      hcp = HCPs[0];

      sampleEnrollees = getEnrollees({
        numOfPrincipals: 2,
        sameSchemeDepPerPrincipal: 1,
        vcshipDepPerPrincipal: 1,
      });
      const principals = TestService.removeNullValues(
        sampleEnrollees.principals
      );
      samplePrncpl1 = {
        ...principals[0],
        scheme: 'AFRSHIP',
        hcpId: hcp.id,
        staffNumber: null,
        serviceNumber: 'NN/0002',
        enrolleeIdNo: '000231',
      };
      samplePrncpl2 = {
        ...principals[1],
        scheme: 'AFRSHIP',
        hcpId: hcp.id,
        staffNumber: null,
        serviceNumber: 'NN/0003',
        enrolleeIdNo: '000232',
      };
      const [p1, p2] = await TestService.seedEnrollees([
        samplePrncpl1,
        samplePrncpl2,
      ]);
      principal1 = p1;
      principal2 = p2;
      p2Dependants = await EnrolleeTest.addDependantsToPrincipal(
        sampleEnrollees.dependants.map((depdnt, i) => ({
          ...depdnt,
          enrolleeIdNo: `${p2.enrolleeIdNo}-${i + 1}`,
        })),
        p2
      );
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.SUPERADMIN
      );
      token = data.token;
    });

    it('it successfully updates the enrollee with the new changes', async (done) => {
      try {
        const p1 = principal1;
        const changes = { firstName: 'New FirstName' };
        const res = await EnrolleeTest.update(p1.id, changes, token);
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(data.firstName).toBe(changes.firstName);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it detects unique violation during update', async (done) => {
      try {
        const p1 = principal1;
        const p2 = principal2;
        const changes = { serviceNumber: p2.serviceNumber };
        const res = await EnrolleeTest.update(p1.id, changes, token);
        expect(res.status).toBe(400);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it can take a nested payload to update a principal and it"s dependants', async (done) => {
      try {
        const p2 = principal2;
        const [d1, d2] = p2Dependants.slice(0, 2);
        const newSurname = 'anyinwa';
        const changes = {
          surname: newSurname,
          dependants: [
            { id: d1.id, surname: newSurname },
            { id: d2.id, surname: newSurname },
          ],
        };
        const res = await EnrolleeTest.update(p2.id, changes, token);
        const getByIds = EnrolleeTest.getEnrolleesByIdArray;
        const updatedDependants = await getByIds([d1.id, d2.id]);
        for (let { surname } of updatedDependants) {
          expect(surname).toBe(newSurname);
        }
        expect(res.status).toBe(200);
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(EnrolleeController.updateEnrollee)
    );
  });
  describe('verifyEnrollee', () => {
    let sampleEnrollees, token, hcp, samplePrincipal;
    let principal, res, verifiedPrincipal;

    beforeAll(async () => {
      await TestService.resetDB();
      const HCPs = await TestService.seedHCPs(1);
      hcp = HCPs[0];

      sampleEnrollees = getEnrollees({
        numOfPrincipals: 1,
        sameSchemeDepPerPrincipal: 1,
        vcshipDepPerPrincipal: 1,
      });
      const principals = TestService.removeNullValues(
        sampleEnrollees.principals
      );
      samplePrincipal = {
        ...principals[0],
        scheme: 'AFRSHIP',
        hcpId: hcp.id,
        staffNumber: null,
        serviceNumber: 'NN/0002',
        enrolleeIdNo: '000231',
      };
      const [seededPrincipal] = await TestService.seedEnrollees([
        samplePrincipal,
      ]);
      principal = seededPrincipal;
      await EnrolleeTest.addDependantsToPrincipal(
        sampleEnrollees.dependants,
        principal
      );
      // console.log(result);
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.SUPERADMIN
      );
      token = data.token;
      res = await EnrolleeTest.verifyPrincipal(principal.id, token);
      verifiedPrincipal = await EnrolleeTest.findById(principal.id);
    });

    it('it returns status 200 and a success message', async (done) => {
      try {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it sets the enrollee"s isVerified status to true', async (done) => {
      try {
        expect(verifiedPrincipal.isVerified).toBe(true);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it sets the dateVerified to today', async (done) => {
      try {
        const { dateVerified } = verifiedPrincipal;
        expect(dateOnly(dateVerified)).toBe(days.today);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it also verifies all dependants under the principal', async (done) => {
      try {
        for (let { isVerified } of verifiedPrincipal.dependants) {
          expect(isVerified).toBe(true);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it sets dateVerified for all dependants to today', async (done) => {
      try {
        for (let { dateVerified } of verifiedPrincipal.dependants) {
          expect(dateOnly(dateVerified)).toBe(days.today);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(EnrolleeController.verifyEnrollee)
    );
  });
  describe('unverifyEnrollee', () => {
    let sampleEnrollees, token, hcp, samplePrincipal;
    let principal, res, unverifiedPrincipal;

    beforeAll(async () => {
      await TestService.resetDB();
      const HCPs = await TestService.seedHCPs(1);
      hcp = HCPs[0];

      sampleEnrollees = getEnrollees({
        numOfPrincipals: 1,
        sameSchemeDepPerPrincipal: 1,
        vcshipDepPerPrincipal: 1,
      });
      const principals = TestService.removeNullValues(
        sampleEnrollees.principals
      );
      samplePrincipal = {
        ...principals[0],
        scheme: 'AFRSHIP',
        hcpId: hcp.id,
        staffNumber: null,
        serviceNumber: 'NN/0002',
        enrolleeIdNo: '000231',
        isVerified: true,
      };
      const [seededPrincipal] = await TestService.seedEnrollees([
        samplePrincipal,
      ]);
      principal = seededPrincipal;
      await EnrolleeTest.addDependantsToPrincipal(
        sampleEnrollees.dependants.map((d) => ({ ...d, isVerified: true })),
        principal
      );
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.SUPERADMIN
      );
      token = data.token;
      res = await EnrolleeTest.unverifyPrincipal(principal.id, token);
      unverifiedPrincipal = await EnrolleeTest.findById(principal.id);
    });

    it('it returns status 200 and a success message', async (done) => {
      try {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it sets the enrollee"s isVerified status to false and dateVerified to null', async (done) => {
      try {
        expect(unverifiedPrincipal.isVerified).toBe(false);
        expect(unverifiedPrincipal.dateVerified).toBe(null);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it also unverifies all dependants under the principal', async (done) => {
      try {
        for (let {
          isVerified,
          dateVerified,
        } of unverifiedPrincipal.dependants) {
          expect(isVerified).toBe(false);
          expect(dateVerified).toBe(null);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(EnrolleeController.unverifyEnrollee)
    );
  });
  describe('deleteEnrollee', () => {
    let sampleEnrollees, token, hcp, samplePrncpl1, samplePrncpl2;
    let principal1, principal2;

    beforeAll(async () => {
      await TestService.resetDB();
      const HCPs = await TestService.seedHCPs(1);
      hcp = HCPs[0];

      sampleEnrollees = getEnrollees({
        numOfPrincipals: 2,
        sameSchemeDepPerPrincipal: 1,
        vcshipDepPerPrincipal: 1,
      });
      const principals = TestService.removeNullValues(
        sampleEnrollees.principals
      );
      samplePrncpl1 = {
        ...principals[0],
        scheme: 'AFRSHIP',
        hcpId: hcp.id,
        staffNumber: null,
        serviceNumber: 'NN/0002',
        enrolleeIdNo: '000231',
      };
      samplePrncpl2 = {
        ...principals[1],
        scheme: 'AFRSHIP',
        hcpId: hcp.id,
        staffNumber: null,
        serviceNumber: 'NN/0003',
        enrolleeIdNo: '000232',
      };
      const [p1, p2] = await TestService.seedEnrollees([
        samplePrncpl1,
        samplePrncpl2,
      ]);
      principal1 = p1;
      principal2 = p2;
      await EnrolleeTest.addDependantsToPrincipal(
        sampleEnrollees.dependants.map((depdnt, i) => ({
          ...depdnt,
          enrolleeIdNo: `${p2.enrolleeIdNo}-${i + 1}`,
        })),
        p2
      );
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.SUPERADMIN
      );
      token = data.token;
    });

    it('it returns status 200 and a success message', async (done) => {
      try {
        const res = await EnrolleeTest.deleteEnrollee(principal1.id, token);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it deletes all of a principal"s dependant along with the principal', async (done) => {
      try {
        await EnrolleeTest.deleteEnrollee(principal2.id, token);
        const depedants = await EnrolleeTest.getPrincipalDependants(
          principal2.id
        );
        expect(depedants).toHaveLength(0);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns not found error if the enrolleeId is not founc', async (done) => {
      try {
        const nonExistingId = principal2.id * 5;
        const res = await EnrolleeTest.deleteEnrollee(nonExistingId, token);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
        expect(res.body.errors[0]).toMatch(/no record found for/i);
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(EnrolleeController.deleteEnrollee)
    );
  });
  describe('getEnrollees', () => {
    let sampleEnrollees, token, HCPs, seededPrincipals, seededDependants, res;
    beforeAll(async () => {
      await TestService.resetDB();
      HCPs = await TestService.seedHCPs(4);
      const { sampleStaffs } = getSampleStaffs(2);
      const dsshipStaff = await TestService.seedStaffs([sampleStaffs[1]]);
      sampleEnrollees = getEnrollees({
        numOfPrincipals: 4,
        sameSchemeDepPerPrincipal: 1,
        vcshipDepPerPrincipal: 1,
      });
      const principals = sampleEnrollees.principals;
      seededPrincipals = await TestService.seedEnrollees([
        {
          ...principals[0],
          scheme: 'AFRSHIP',
          enrolmentType: 'principal',
          hcpId: HCPs[0].id,
          isVerified: true,
        },
        {
          ...principals[1],
          scheme: 'DSSHIP',
          enrolmentType: 'principal',
          hcpId: HCPs[1].id,
          isVerified: true,
          staffNumber: dsshipStaff.staffIdNo,
        },
        {
          ...principals[2],
          scheme: 'VCSHIP',
          enrolmentType: 'principal',
          hcpId: HCPs[2].id,
          isVerified: true,
        },
        {
          ...principals[3],
          scheme: 'AFRSHIP',
          enrolmentType: 'special-principal',
          hcpId: HCPs[3].id,
          isVerified: true,
          staffNumber: undefined,
          rank: 'General',
          armOfService: 'army',
          serviceNumber: principals[3].serviceNumber || 'SN/001/SP',
        },
      ]);

      const deps = sampleEnrollees.dependants.map((d) => {
        for (let p of seededPrincipals) {
          const regexPrincipalEnrolleeIdNo = new RegExp(`${p.enrolleeIdNo}-`);
          if (d.enrolleeIdNo.match(regexPrincipalEnrolleeIdNo)) {
            return {
              ...d,
              principalId: p.id,
              hcpId: p.hcpId,
            };
          }
        }
      });
      seededDependants = await TestService.seedEnrollees(deps);

      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.ENROLMENT_OFFICER
      );
      token = data.token;
      res = await EnrolleeApi.getAll('', token);
    });

    it('returns total count of all the enrollees in the db', async (done) => {
      try {
        const totalCount = seededPrincipals.length + seededDependants.length;
        const { count, rows } = res.body.data;
        expect(count).toEqual(totalCount);
        expect(rows).toHaveLength(totalCount);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can paginate the response', async (done) => {
      try {
        const pageSize = 3;
        const page = 0;
        const query = `pageSize=${pageSize}&page=${page}`;
        const res = await EnrolleeApi.getAll(query, token);
        const totalCount = seededPrincipals.length + seededDependants.length;
        const { count, rows } = res.body.data;
        expect(count).toEqual(totalCount);
        expect(rows).toHaveLength(pageSize);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can filter the response', async (done) => {
      try {
        const filters = {
          scheme: 'afrship',
          gender: 'female',
          armOfService: 'army',
          hcpId: HCPs[0].id,
        };
        for (let [key, value] of Object.entries(filters)) {
          const query = `searchField=${key}&searchValue=${value}`;
          const res = await EnrolleeApi.getAll(query, token);
          const { rows } = res.body.data;
          for (let enrollee of rows) {
            expect(`${enrollee[key]}`).toMatch(new RegExp(value, 'i'));
          }
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can filter by enrolmentType=principal to return only principals', async (done) => {
      try {
        const query = 'searchField=enrolmentType&searchValue=principal';
        const res = await EnrolleeApi.getAll(query, token);
        const { rows } = res.body.data;
        for (let enrollee of rows) {
          expect(enrollee.isPrincipal).toBe(true);
          expect(enrollee.isDependant).toBe(false);
          expect(enrollee.principalId).toBe(null);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can filter by enrolmentType=dependant to return only dependants', async (done) => {
      try {
        const query = 'searchField=enrolmentType&searchValue=dependant';
        const res = await EnrolleeApi.getAll(query, token);
        const { rows } = res.body.data;
        for (let enrollee of rows) {
          expect(enrollee.isPrincipal).toBe(false);
          expect(enrollee.isDependant).toBe(true);
          expect(enrollee.principalId).not.toBe(null);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can search by specific value', async (done) => {
      try {
        const subject = seededPrincipals[0];
        const query = `searchItem=${subject.email}`;
        const res = await EnrolleeApi.getAll(query, token);
        const { rows } = res.body.data;
        expect(rows[0].email).toEqual(subject.email);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can query by isVerified=true to return only verified enrollees', async (done) => {
      try {
        const query = 'isVerified=true';
        const res = await EnrolleeApi.getAll(query, token);
        const { rows } = res.body.data;
        for (let enrollee of rows) {
          expect(enrollee.isVerified).toBe(true);
        }
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(EnrolleeController.getEnrollees)
    );
  });
  describe('getEnrolleeById', () => {
    let sampleEnrollees, token, HCPs, seededPrincipals, seededDependants, res;
    beforeAll(async () => {
      await TestService.resetDB();
      HCPs = await TestService.seedHCPs(4);

      sampleEnrollees = getEnrollees({
        numOfPrincipals: 1,
        sameSchemeDepPerPrincipal: 1,
        vcshipDepPerPrincipal: 1,
      });
      const principals = sampleEnrollees.principals;
      seededPrincipals = await TestService.seedEnrollees([
        {
          ...principals[0],
          scheme: 'AFRSHIP',
          enrolmentType: 'principal',
          hcpId: HCPs[0].id,
          isVerified: true,
        },
      ]);

      const deps = sampleEnrollees.dependants.map((d) => {
        for (let p of seededPrincipals) {
          const regexPrincipalEnrolleeIdNo = new RegExp(`${p.enrolleeIdNo}-`);
          if (d.enrolleeIdNo.match(regexPrincipalEnrolleeIdNo)) {
            return {
              ...d,
              principalId: p.id,
              hcpId: p.hcpId,
            };
          }
        }
      });
      seededDependants = await TestService.seedEnrollees(deps);
      const { sampleStaffs } = getSampleStaffs(1);
      const data = await TestService.getToken(
        sampleStaffs[0],
        ROLES.ENROLMENT_OFFICER
      );
      token = data.token;
      res = await EnrolleeApi.getById(seededPrincipals[0].id, token);
    });

    it('returns status 200 on successful GET request', async (done) => {
      try {
        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('data');
        done();
      } catch (e) {
        done(e);
      }
    });
    it('can get a dependant enrollee by id', async (done) => {
      try {
        const res = await EnrolleeApi.getById(seededDependants[0].id, token);
        expect(res.status).toEqual(200);
        expect(res.body).toHaveProperty('data');
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block',
      TestService.testCatchBlock(EnrolleeController.getByEnrolleeId)
    );
  });
});
