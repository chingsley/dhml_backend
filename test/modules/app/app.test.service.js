import moment from 'moment';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import db from '../../../src/database/models';
import getSampleUsers from '../../../src/shared/samples/user.samples';
const bcrypt = require('bcryptjs');
const BCRYPT_SALT = Number(process.env.BCRYPT_SALT);
const ROLES = require('../../../src/shared/constants/roles.constants');

export const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
export const today = moment().format('YYYY-MM-DD');
export const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

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
  // static async getToken(staff, role) {
  //   const { sampleUsers }
  //  const stff = await db.staff.upsert(staff);
  //  const user = await db.User.upsert()

  // }

  static getHash(sampleValue = 'Testing*123') {
    return bcrypt.hashSync(sampleValue, BCRYPT_SALT);
  }
}

export default TestService;
