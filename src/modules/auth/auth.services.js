import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import db from '../../database/models';
import {
  DEFAULT_PWD_EXPIRED,
  LGN001,
  INVALID_CREDENTIAL,
  LGN003,
  LGN002,
  INCORRECT_OLD_PASSWORD,
} from '../../shared/constants/errors.constants';
import { isExpired } from '../../utils/helpers';
import Jwt from '../../utils/Jwt';
import { t24Hours } from '../../utils/timers';
import AppService from '../app/app.service';
import { throwError } from '../../shared/helpers';
import { USERTYPES } from '../../shared/constants/lists.constants';

const { JWT_SECTET } = process.env;

export default class AuthService extends AppService {
  constructor({ body, files, query, params, user: operator }) {
    super({ body, files, query, params, operator });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
    this.operator = operator;
  }

  handleUserLogin = async () => {
    const { email, password } = this.body;
    let staff = await this.findStaffByEmail(email, { errorCode: LGN001 });
    const user = this.getUserInfoFromStaff(staff, { errorCode: LGN002 });
    this.rejectExpiredDefaultPass(user.password);
    this.validatePassword(password, user.password.value);
    await user.reload({
      include: [
        { model: db.Staff, as: 'staffInfo' },
        { model: db.Role, attributes: ['title'], as: 'role' },
      ],
    });
    return {
      user,
      token: Jwt.generateToken({ userId: user.id }),
    };
  };

  handleHcpLogin = async () => {
    const { username, password } = this.body;
    let hcp = await this.findHcpByEmailOrCode(username);
    this.rejectExpiredDefaultPass(hcp.password);
    this.validatePassword(password, hcp.password.value);
    return {
      hcp: { ...hcp.dataValues, password: undefined },
      token: Jwt.generateToken({ hcpId: hcp.id }),
    };
  };

  changeUserPassword = async function (user) {
    const { oldPassword, newPassword } = this.body;
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
    const { oldPassword, newPassword } = this.body;
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

  resendDefaultPassword = async function () {
    const t = await db.sequelize.transaction();
    try {
      const { userType, email, returnPassword } = this.body;
      const record = await this.findByEmail(email, userType);
      this.ensurePasswordIsDefaultValue(record.password);
      let defaultPass, data, message;
      const trnx = { transaction: t };
      defaultPass = await this.generateDefaultPwd();
      await record.password.update(
        { value: this.hashPassword(defaultPass), expiryDate: t24Hours },
        trnx
      );
      if (returnPassword) {
        data = { password: defaultPass };
        message = 'Successful';
      } else {
        await this.sendPassword(record.email, defaultPass);
        message = 'The new password has been sent to the user';
      }
      await t.commit();
      return { message, data };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  };

  initiatePasswordResetSvc = async function () {
    const { userType, email } = this.body;
    const user = await this.$findUserForPasswordReset(userType, email);
    this.handlePasswordResetNotification(user, userType, db.Token);
    return {
      message: 'Please check your email for the password reset instructions',
      user,
    };
  };

  validatePasswordResetTokenSvc = async function (resetToken) {
    const token = await db.Token.findToken({ value: resetToken });
    this.rejectIf(!token, {
      withError: 'Invalid reset token',
      status: 401,
      errorCode: 'PRT001',
    });
    this.rejectIf(token.isExpired, {
      withError: 'Token has expired',
      status: 401,
      errorCode: 'PRT002',
    });
    return token;
  };

  completePasswordResetSvc = async function ({
    userType,
    password: newPassword,
    email,
    resetToken,
  }) {
    const token = await this.validatePasswordResetTokenSvc(resetToken);
    let password;
    if (userType === USERTYPES.USER) {
      const staff = await db.Staff.findWhere({ email });

      this.rejectIf(!staff, { withError: 'user email not found' });
      this.rejectIf(!staff.userInfo, { withError: 'staff not signed up' });
      this.rejectIf(token.userId !== staff.userInfo.id, {
        withError: 'Invalid reset token',
        errorCode: 'PRT003',
      });
      password = staff.userInfo.password;
    } else {
      const hcp = await db.HealthCareProvider.findWhere({ email });

      this.rejectIf(!hcp, { withError: 'hcp email not found' });
      this.rejectIf(!hcp.password, { withError: 'hcp not signed up as user' });
      this.rejectIf(token.hcpId !== hcp.id, {
        withError: 'Invalid reset token',
        errorCode: 'PRT003',
      });
      password = hcp.password;
    }
    await password.update({
      value: this.hashPassword(newPassword),
      isDefaultValue: false,
    });

    await token.destroy();

    return { message: 'successfully updated password' };
  };

  $findUserForPasswordReset = function (userType, email) {
    let modelName, includeOption;
    if (userType === USERTYPES.USER) {
      // required: true => staff must have user account, else return null
      includeOption = { model: db.User, as: 'userInfo', required: true };
      modelName = 'Staff';
    } else {
      // required: true => hcp must have a password, else return null
      includeOption = { model: db.Password, as: 'password', required: true };
      modelName = 'HealthCareProvider';
    }
    return this.findOneRecord({
      modelName,
      where: { email: { [Op.iLike]: email } },
      include: includeOption,
      isRequired: false,
    });
  };

  findByEmail = async function (email, recordType) {
    const errorIfNotFound = `No ${recordType} found for the email ${email}`;
    if (recordType === USERTYPES.USER) {
      const staff = await this.findStaffByEmail(email, {
        errorIfNotFound: `no staff exists with email: ${email}`,
      });
      const user = this.getUserInfoFromStaff(staff, {
        errorIfNotFound: `The Staff member with email ${email} has not been registered as a user. Please register the staff first`,
      });
      return { ...user.dataValues, email };
    }
    if (recordType === 'hcp') {
      return await this.findHcpByEmailOrCode(email, errorIfNotFound);
    }
  };

  findStaffByEmail = function (email, options) {
    const {
      errorIfNotFound = INVALID_CREDENTIAL,
      errorCode,
      isRequired = true,
    } = options;
    return this.findOneRecord({
      modelName: 'Staff',
      where: { email: { [Op.iLike]: `${email}` } },
      include: {
        model: db.User,
        as: 'userInfo',
        include: [
          { model: db.Password, as: 'password' },
          { model: db.Role, attributes: ['title'], as: 'role' },
        ],
      },
      isRequired,
      errorIfNotFound,
      status: 401,
      errorCode,
    });
  };

  getUserInfoFromStaff = (staff, options) => {
    const { errorIfNotFound = INVALID_CREDENTIAL, errorCode } = options;
    if (!staff.userInfo) {
      throwError({
        status: 401,
        error: [errorIfNotFound],
        errorCode,
      });
    }
    return staff.userInfo;
  };

  findHcpByEmailOrCode = function (
    username,
    errorIfNotFound = INVALID_CREDENTIAL,
    isRequired = true
  ) {
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
      isRequired,
      errorIfNotFound,
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
        errorCode: LGN003,
      });
    }
  };

  ensurePasswordIsDefaultValue(password) {
    if (password && !password.isDefaultValue) {
      throwError({
        status: 401,
        error: [
          'User has already changed their default password. The system does not resend a default password after it has been changed. To get a new password, please use the password change or password reset feature',
        ],
      });
    }
  }

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
