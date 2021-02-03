import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import db from '../../database/models';
import {
  DEFAULT_PWD_EXPIRED,
  LGN001,
  INVALID_CREDENTIAL,
  LGN002,
  INCORRECT_OLD_PASSWORD,
} from '../../shared/constants/errors.constants';
import { isExpired } from '../../utils/helpers';
import Jwt from '../../utils/Jwt';
import { t24Hours } from '../../utils/timers';
import AppService from '../app/app.service';

const { JWT_SECTET } = process.env;

export default class AuthService extends AppService {
  constructor({ body, files, query, params }) {
    super({ body, files, query, params });
    this.reqBody = body;
    this.files = files;
    this.query = query;
    this.params = params;
  }

  handleUserLogin = async () => {
    const { email, password } = this.reqBody;
    let user = await this.findUserByEmail(email);
    this.rejectExpiredDefaultPass(user.password);
    this.validatePassword(password, user.password.value);
    return {
      user: { ...user.dataValues, password: undefined },
      token: Jwt.generateToken({ userId: user.id }),
    };
  };

  handleHcpLogin = async () => {
    const { username, password } = this.reqBody;
    let hcp = await this.findHcpByEmailOrCode(username);
    this.rejectExpiredDefaultPass(hcp.password);
    this.validatePassword(password, hcp.password.value);
    return {
      hcp: { ...hcp.dataValues, password: undefined },
      token: Jwt.generateToken({ hcpId: hcp.id }),
    };
  };

  changeUserPassword = async function (user) {
    const { oldPassword, newPassword } = this.reqBody;
    const { password } = user;
    await this.validatePassword(
      oldPassword,
      password.value,
      INCORRECT_OLD_PASSWORD
    );
    await password.update({
      value: bcrypt.hashSync(newPassword, JWT_SECTET),
      isDefaultValue: false,
      expiryDate: t24Hours,
    });
    return { ...user.dataValues, password: undefined };
  };

  changeHcpPassword = async function (hcp) {
    const { oldPassword, newPassword } = this.reqBody;
    const { password } = hcp;
    await this.validatePassword(
      oldPassword,
      password.value,
      INCORRECT_OLD_PASSWORD
    );
    await password.update({
      value: bcrypt.hashSync(newPassword, JWT_SECTET),
      isDefaultValue: false,
      expiryDate: t24Hours,
    });
    return { ...hcp.dataValues, password: undefined };
  };

  findUserByEmail = function (email) {
    return this.findOneRecord({
      modelName: 'User',
      where: { email: { [Op.iLike]: `${email}` } },
      include: [
        { model: db.Password, as: 'password' },
        { model: db.Role, attributes: ['title'], as: 'role' },
      ],
      isRequired: true,
      errorIfNotFound: INVALID_CREDENTIAL,
      status: 401,
      errorCode: LGN001,
    });
  };

  findHcpByEmailOrCode = function (username) {
    return this.findOneRecord({
      modelName: 'HealthCareProvider',
      where: {
        [Op.or]: [
          { email: { [Op.iLike]: `${username}` } },
          { code: { [Op.iLike]: `${username}` } },
        ],
      },
      include: [
        { model: db.Password, as: 'password' },
        { model: db.Role, attributes: ['title'], as: 'role' },
      ],
      isRequired: true,
      errorIfNotFound: INVALID_CREDENTIAL,
      status: 401,
      errorCode: LGN001,
    });
  };

  validatePassword = function (
    inputPass,
    savedPasswordHash,
    errorMsg = INVALID_CREDENTIAL
  ) {
    const isCorrectPassword = bcrypt.compareSync(inputPass, savedPasswordHash);
    if (!isCorrectPassword) {
      this.throwError({
        status: 401,
        error: [errorMsg],
        errorCode: LGN002,
      });
    }
  };

  rejectExpiredDefaultPass(password) {
    const pwd = password;
    if (pwd.isDefaultValue && isExpired(pwd.expiryDate)) {
      this.throwError({
        status: 401,
        error: [DEFAULT_PWD_EXPIRED],
      });
    }
  }
}
