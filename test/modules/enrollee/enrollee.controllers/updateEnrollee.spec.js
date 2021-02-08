import getEnrollees from '../../../../src/shared/samples/enrollee.samples';
import TestService from '../../app/app.test.service';
import ROLES from '../../../../src/shared/constants/roles.constants';
import getSampleStaffs from '../../../../src/shared/samples/staff.samples';
import EnrolleeApi from '../enrollee.test.api';

// const { log } = console;

describe('EnrolleeController', () => {
  describe('getAllEnrollees', () => {
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
      res = await EnrolleeApi.getAll(null, token);
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
  });
});
