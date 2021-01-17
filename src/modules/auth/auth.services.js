import bcrypt from 'bcryptjs';
import db from '../../database/models';
import Jwt from '../../utils/Jwt';
import AppService from '../app/app.service';

export default class AuthService extends AppService {
  constructor(reqBody) {
    super(reqBody);
  }

  handleLogin = async () => {
    const { email, password } = this.reqBody;
    let user = await this.findUserByEmail(email);
    this.validatePassword(password, user.password.value);
    return {
      user: { ...user.dataValues, password: undefined },
      token: Jwt.generateToken(user),
    };
  };

  findUserByEmail = async function (email) {
    const user = await db.User.findOne({
      where: { email },
      include: [
        { model: db.Password, attributes: ['value'], as: 'password' },
        { model: db.Role, attributes: ['title'], as: 'role' },
      ],
    });
    if (!user) {
      this.throwError({
        status: 401,
        err: 'Login failed. Invalid credentials.',
        errorCode: 'LGN001',
      });
    }
    return user;
  };

  validatePassword = function (inputPass, savedPwdHash) {
    const isCorrectPassword = bcrypt.compareSync(inputPass, savedPwdHash);
    if (!isCorrectPassword) {
      this.throwError({
        status: 401,
        err: 'Login failed. Invalid credentials.',
        errorCode: 'LGN002',
      });
    }
  };
}
