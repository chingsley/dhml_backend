import db from '../../src/database/models';
import { sampleUsers } from './user.testSamples';
import AppTestHelper from '../app/app.testHelper';

class UserTestHelper extends AppTestHelper {
  async createBulkUsers() {
    const userRole = await this.createRole('user');
    return await db.User.bulkCreate(
      sampleUsers.map((user) => ({ ...user, roleId: userRole.id }))
    );
  }

  async createUser({ user, role }) {
    const userRole = await this.createRole(role);
    return db.User.create({ ...user, roleId: userRole.id });
  }

  async createRole(roleType) {
    const [role] = await db.Role.findOrCreate({ where: { name: roleType } });
    return role;
  }

  getSampleUsers() {
    return sampleUsers;
  }
}

export default UserTestHelper;
