/* eslint-disable jest/expect-expect */
import TestService from '../app/app.test.service';
import getSampleHCPs from '../../../src/shared/samples/hcp.samples';
import ROLES from '../../../src/shared/constants/roles.constants';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import SpecialtyApi from './specialty.test.api';
import SpecialtyController from '../../../src/modules/specialty/specialty.controller';
import _SpecialtyService from './specialty.test.services';
import _StaffService from '../staff/staff.test.services';
import HcpSpecialityService from './hcp.specialty.test.services';
import { _random } from '../../../src/utils/helpers';

describe('getAllSpecialties', () => {
  let token, seededHCPs, seededHcpSpecialties, defaultRes, seededSpecialties, hcpWithoutSpecialties, hcpWithSpecialties;
  const COUNT_SPECIALTIES = 20;
  beforeAll(async () => {
    await TestService.resetDB();
    const hcps = getSampleHCPs();

    seededHCPs = await _SpecialtyService.hcpBulkInsert([
      ...hcps.slice(0, 10),
      ...hcps.slice(hcps.length - 10).map((hcp) => ({
        ...hcp,
        status: 'suspended',
      })),
    ]);

    [hcpWithoutSpecialties, ...hcpWithSpecialties] = seededHCPs;
    const seedResult = await HcpSpecialityService.seedRandomHcpSpecialties(hcpWithSpecialties, { numOfSpecialities: COUNT_SPECIALTIES });
    seededSpecialties = seedResult.seededSpecialties;
    seededHcpSpecialties = seedResult.seededHcpSpecialties;
    const { sampleStaffs: stff } = getSampleStaffs(1);
    const data = await TestService.getToken(stff[0], ROLES.SUPERADMIN);
    token = data.token;
    defaultRes = await SpecialtyApi.getAllSpecialties('', token);
  });
  it('returns status 200 and the total record in the db', async (done) => {
    try {
      const res = defaultRes;
      const { data } = res.body;
      expect(res.status).toBe(200);
      expect(data.count).toEqual(COUNT_SPECIALTIES);
      expect(data.rows).toHaveLength(COUNT_SPECIALTIES);
      done();
    } catch (e) {
      done(e);
    }
  });
  it('can filter the specialties by specialty name', async (done) => {
    try {
      const filterText = _random(seededSpecialties).name.slice(0, 4);
      const query = `name=${filterText}`;
      const res = await SpecialtyApi.getAllSpecialties(query, token);;
      const { data } = res.body;
      expect(res.status).toBe(200);
      data.rows.forEach(specialty => {
        expect(specialty.name).toMatch(new RegExp(filterText));
      });
      done();
    } catch (e) {
      done(e);
    }
  });
  it('can filte the specialties by hcpId name', async (done) => {
    try {
      const hcpId = _random(seededHcpSpecialties).hcpId;
      const query = `hcpId=${hcpId}`;
      const res = await SpecialtyApi.getAllSpecialties(query, token);
      const { data } = res.body;
      expect(res.status).toBe(200);

      const hcpSpecialties = await HcpSpecialityService.queryHcpSpecialties(hcpId);
      expect(data.count).toEqual(hcpSpecialties.length);
      expect(data.rows).toHaveLength(hcpSpecialties.length);
      hcpSpecialties.forEach(specialty => {
        specialty.hcps.forEach(hcp => {
          expect(hcp.id).toEqual(hcpId);
        });
      });
      done();
    } catch (e) {
      done(e);
    }
  });
  it(
    'it catches errors thrown in the try block',
    TestService.testCatchBlock(SpecialtyController.getAllSpecialists)
  );
});