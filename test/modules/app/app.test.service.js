import moment from 'moment';
import { getSamplePasswords } from '../../../src/shared/samples/password.samples';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import db from '../../../src/database/models';
const bcrypt = require('bcryptjs');
const BCRYPT_SALT = Number(process.env.BCRYPT_SALT);

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

  static async seedUsers(noOfUsers, userRole = 'dept user') {
    const { sampleStaffList, sampleUsers } = getSampleStaffs(noOfUsers);
    await db.Staff.bulkCreate(sampleStaffList);
    const role = await db.Role.create({ title: userRole });
    const usersWithRoles = sampleUsers.map((user) => ({
      ...user,
      roleId: role.id,
    }));
    const users = await db.User.bulkCreate(usersWithRoles);
    const password = this.getHash('Testing*123');
    const samplePasswords = users.map((user) => ({
      userId: user.id,
      value: password,
    }));
    await db.Password.bulkCreate(samplePasswords);
    return users;
  }

  static getHash(sampleValue = 'Testing*123') {
    return bcrypt.hashSync(sampleValue, BCRYPT_SALT);
  }
}

export default TestService;
