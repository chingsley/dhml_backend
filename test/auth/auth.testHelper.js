import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from '../../src/database/models';
import UserTestHelper from '../user/user.testHelper';
import supertest from 'supertest';
import server from '../../src/server';

const app = supertest(server.server);

class AuthTestHelper extends UserTestHelper {
  async getUserPasswordResetToken(userEmail) {
    const user = await db.User.findOne({
      where: { email: userEmail },
      include: { model: db.PasswordReset, as: 'passwordReset' },
    });
    return user.passwordReset.resetToken;
  }

  async updatePasswordResetToken(resetToken, update) {
    const token = await db.PasswordReset.findOne({ where: { resetToken } });
    if (!token) {
      throw new Error(`${resetToken} not found in the db`);
    }
    await token.update({ ...update });
    return token;
  }

  async mockTokenLevel(role) {
    const password = 'pretend_correct_password';
    const originalImplementation = db.User.findOne;
    db.User.findOne = jest.fn().mockReturnValue({
      uuid: uuidv4(),
      username: 'mock_username',
      password: bcrypt.hashSync(password),
      role: { name: role },
    });
    const res = await app
      .post('/api/v1/auth/login')
      .send({ email: 'user_email@gmail.com', password });
    db.User.findOne = originalImplementation;
    return res.body.data.token;
  }
}

export default AuthTestHelper;
