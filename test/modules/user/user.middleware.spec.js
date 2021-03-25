/* eslint-disable jest/expect-expect */
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import ROLES from '../../../src/shared/constants/roles.constants';
import TestService from '../app/app.test.service';
import UserApi from './user.test.api';
import UserMiddleware from '../../../src/modules/user/user.middleware';

describe('userMiddleware', () => {
  describe('validateUserIdArr', () => {
    let token;
    beforeAll(async () => {
      await TestService.resetDB();
      const { sampleStaffs: stffs } = getSampleStaffs(1);
      const data = await TestService.getToken(stffs[0], ROLES.SUPERADMIN);
      token = data.token;
    });

    it('returns 400 error for non-integer user IDs', async (done) => {
      try {
        const res = await UserApi.delete(['a', 1], token);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors', [
          '"userIds[0]" must be a number',
        ]);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('returns 400 error the array of userIds is empty', async (done) => {
      try {
        const res = await UserApi.delete([], token);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors', [
          '"userIds" must contain at least 1 items',
        ]);
        done();
      } catch (e) {
        done(e);
      }
    });
    it(
      'it catches errors thrown in the try block ',
      TestService.testCatchBlock(UserMiddleware.validateUserIdArr)
    );
  });
});
