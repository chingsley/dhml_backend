import bcrypt from 'bcryptjs';
import db from '../../database/models';
import Jwt from '../../utils/Jwt';
import AppService from '../app/app.service';

const { JWT_SECTET } = process.env;

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

  handlePasswordChange = async function (userId) {
    const { oldPassword, newPassword } = this.reqBody;
    const user = await db.User.findOneWhere(
      { id: userId },
      {
        include: { model: db.Password, as: 'password' },
        throwErrorIfNotFound: true,
        errorMsg: 'Failed Authorization. User account not found',
        errorCode: 'AUTH003',
      }
    );
    const { password } = user;
    await this.validatePassword(oldPassword, password.value);
    await password.update({ value: bcrypt.hashSync(newPassword, JWT_SECTET) });
    return { ...user.dataValues, password: undefined };
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
