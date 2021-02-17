import db from '../../../src/database/models';

import TestService from '../app/app.test.service';
import Password from '../../../src/utils/Password';
import { TEST_PASSWORD } from '../../../src/shared/constants/passwords.constants';

class TestUser extends TestService {
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
}

export default TestUser;
