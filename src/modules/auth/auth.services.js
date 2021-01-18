import bcrypt from 'bcryptjs';
import db from '../../database/models';
import {
  ACCOUNT_NOT_FOUND_CODE,
  ACCOUNT_NOT_FOUND_ERROR,
  DEFAULT_PWD_EXPIRED,
  EMAIL_NOT_FOUND_CODE,
  INVALID_CREDENTIAL,
  PASSWORD_INCORRECT_CODE,
} from '../../shared/constants/errors.constants';
import Jwt from '../../utils/Jwt';
import AppService from '../app/app.service';

const { JWT_SECTET } = process.env;

export default class AuthService extends AppService {
  constructor({ body, files, query }) {
    super({ body, files, query });
    this.reqBody = body;
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
        errorMsg: ACCOUNT_NOT_FOUND_ERROR,
        errorCode: ACCOUNT_NOT_FOUND_CODE,
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
        err: INVALID_CREDENTIAL,
        errorCode: EMAIL_NOT_FOUND_CODE,
      });
    } else if (user.hasExpiredDefaultPassword) {
      this.throwError({
        status: 401,
        err: DEFAULT_PWD_EXPIRED,
      });
    }
    return user;
  };

  validatePassword = function (inputPass, savedPasswordHash) {
    const isCorrectPassword = bcrypt.compareSync(inputPass, savedPasswordHash);
    if (!isCorrectPassword) {
      this.throwError({
        status: 401,
        err: INVALID_CREDENTIAL,
        errorCode: PASSWORD_INCORRECT_CODE,
      });
    }
  };
}
