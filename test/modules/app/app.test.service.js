import bcrypt from 'bcryptjs';
import supertest from 'supertest';
import moment from 'moment';

import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import db from '../../../src/database/models';
import getSampleUsers from '../../../src/shared/samples/user.samples';
import { TEST_PASSWORD } from '../../../src/shared/constants/passwords.constants';
import server from '../../../src/server';
import { Cypher } from '../../../src/utils/Cypher';
import getSampleHCPs from '../../../src/shared/samples/hcp.samples';

const { AES_KEY, IV_KEY, BCRYPT_SALT } = process.env;
export const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
export const today = moment().format('YYYY-MM-DD');
export const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

const app = supertest(server.server);
const cypher = new Cypher(AES_KEY, IV_KEY);

class TestService {
  constructor({ sampleStaff, sampleStaffs, sampleUser, sampleUsers }) {
    this.sampleStaff = sampleStaff;
    this.sampleStaffs = sampleStaffs;
    this.sampleUser = sampleUser;
    this.sampleUsers = sampleUsers;
  }
  static async resetDB(modelsArr) {
    if (modelsArr) {
      if (modelsArr && !Array.isArray(modelsArr)) {
        throw new Error(
          '"resetDB" expects an optional array of models as argument'
        );
      }
      for (let i = 0; i < modelsArr.length; i++) {
        await modelsArr[i].destroy({ where: {}, truncate: { cascade: true } });
      }
    } else {
      const dbHcp = db.HealthCareProvider;
      await db.Enrollee.destroy({ where: {}, truncate: { cascade: true } });
      await db.Password.destroy({ where: {}, truncate: { cascade: true } });
      await db.User.destroy({ where: {}, truncate: { cascade: true } });
      await db.Staff.destroy({ where: {}, truncate: { cascade: true } });
      await db.Role.destroy({ where: {}, truncate: { cascade: true } });
      await dbHcp.destroy({ where: {}, truncate: { cascade: true } });
    }
  }

  static async seedUsers(noOfUsers = 1, userRole = 'dept user') {
    const { sampleStaffs } = getSampleStaffs(noOfUsers);
    const { sampleUsers } = getSampleUsers(sampleStaffs);
    await db.Staff.bulkCreate(sampleStaffs);
    const role = await db.Role.create({ title: userRole });
    const users = await db.User.bulkCreate(
      sampleUsers.map((user) => ({
        ...user,
        roleId: role.id,
      }))
    );
    const password = this.getHash('Testing*123');
    await db.Password.bulkCreate(
      users.map((user) => ({
        userId: user.id,
        value: password,
      }))
    );
    return { users };
  }
  static async getToken(staff, roleTitle) {
    const { sampleUsers } = getSampleUsers([staff]);
    await db.Staff.upsert(staff);
    let role = await db.Role.findOne({ where: { title: roleTitle } });
    if (!role) {
      role = await db.Role.create({ title: roleTitle });
    }
    const [user] = await db.User.upsert(
      { ...sampleUsers[0], roleId: role.id },
      { returning: true }
    );

    await db.Password.upsert({
      userId: user.id,
      value: this.getHash(TEST_PASSWORD),
    });

    const res = await app.post('/api/v1/auth/login').send(
      cypher.formatRequest({
        email: user.email,
        password: TEST_PASSWORD,
      })
    );
    const { data } = res.body;
    return { user: data.user, token: data.token };
  }

  static seedHCPs(count) {
    return db.HealthCareProvider.bulkCreate(getSampleHCPs(count));
  }

  static getHash(sampleValue = 'Testing*123') {
    return bcrypt.hashSync(sampleValue, Number(BCRYPT_SALT));
  }
}

export default TestService;
