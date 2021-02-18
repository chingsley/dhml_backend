import db from '../../../src/database/models';

import TestService from '../app/app.test.service';
import Password from '../../../src/utils/Password';
import { TEST_PASSWORD } from '../../../src/shared/constants/passwords.constants';

class _UserService extends TestService {
  static async seedBulk(sampleUsers) {
    const users = await db.User.bulkCreate(sampleUsers);
    const passwords = users.map((user) => ({
      userId: user.id,
      value: Password.hash(TEST_PASSWORD),
      isDefaultValue: false,
    }));
    await db.Password.bulkCreate(passwords);
    return users;
  }

  static async seedOne(sampleUser) {
    const user = await db.User.create(sampleUser);
    const passwords = {
      userId: user.id,
      value: Password.hash(TEST_PASSWORD),
      isDefaultValue: false,
    };
    await db.Password.create(passwords);
    return user;
  }

  static findOneWhere(condition) {
    return db.User.findOne({ where: condition });
  }
}

export default _UserService;
