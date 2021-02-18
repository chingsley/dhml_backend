/* eslint-disable jest/expect-expect */
/* eslint-disable no-undef */
import TestService from '../app/app.test.service';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import ROLES, { BASIC } from '../../../src/shared/constants/roles.constants';
import _RoleService from './role.test.service';
import RoleApi from './role.test.api';
import RoleController from '../../../src/modules/role/role.controller';

describe('RoleController', () => {
  describe('getAllRoles', () => {
    let res, seededRoles, stffs;
    beforeAll(async () => {
      await TestService.resetDB();
      seededRoles = await _RoleService.seedAllRoles();
      stffs = getSampleStaffs(2).sampleStaffs;
    });
    it('returns all available roles to a superadmin', async (done) => {
      try {
        const { token } = await TestService.getToken(
          stffs[0],
          ROLES.SUPERADMIN
        );
        res = await RoleApi.getAll(token);
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(data.count).toEqual(seededRoles.length);
        expect(data.rows).toHaveLength(seededRoles.length);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns only the "basic" role to a non-superadmin', async (done) => {
      try {
        const { token } = await TestService.getToken(stffs[1], ROLES.ADMIN);
        res = await RoleApi.getAll(token);
        const { data } = res.body;
        expect(res.status).toBe(200);
        expect(data.count).toEqual(1);
        expect(data.rows).toHaveLength(1);
        expect(data.rows[0].title).toEqual(BASIC);
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block of getManifest',
      TestService.testCatchBlock(RoleController.getAllRoles)
    );
  });
});
