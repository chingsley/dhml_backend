import Joi from '@hapi/joi';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/models';
import Jwt from '../utils/Jwt';
import helper from '../utils/helpers';
import Email from '../utils/Email';
import UserService from '../resources/user/user.services';
import roles, { accountOwner } from '../utils/allowedRoles';

/**
 * AuthService inherits from UserSerice, while
 * UserService inturn inherits from AppService.
 * Hence, AuthService has access to all the
 * methods of both UserService and AppService
 */
export default class AuthService extends UserService {
  constructor(req, res) {
    super(req, res);
  }

  handleLogin = async () => {
    const { email, username, password } = this.req.body;
    let user = email
      ? await this.findBy('email', email)
      : await this.findBy('username', username);
    if (!user) {
      this.throwError({
        status: 401,
        err: 'Login failed. Invalid credentials.',
        errorCode: 'LGN001',
      });
    }
    const isCorrectPassword = bcrypt.compareSync(password, user.password);
    if (isCorrectPassword) {
      return {
        user: { ...user.dataValues, password: undefined },
        token: Jwt.generateToken(user),
      };
    } else {
      this.throwError({
        status: 401,
        err: 'Login failed. Invalid credentials.',
        errorCode: 'LGN002',
      });
    }
  };

  initiatePasswordReset = async () => {
    const { email } = this.req.body;
    let passwordReset = null;
    const user = await this.findBy('email', email);
    if (user) {
      passwordReset = await db.PasswordReset.upsert(
        {
          userId: user.id,
          resetToken: uuidv4(),
          expires: helper.setMinutes(30),
        },
        { returning: true }
      );
      const message = Email.getPasswordResetTemplate(
        passwordReset[0].resetToken
      );
      await Email.send({ email: user.email, message, html: message });
    }

    return user;
  };

  handleResetTokenValidation = async () => {
    const { token: resetToken } = this.req.headers;
    const isValidUUID = this.validateUUID(resetToken);
    if (!isValidUUID)
      // token is an invalid uuid value
      this.throwError({
        status: 400,
        err: 'invalid token',
        errorCode: 'PRT001',
      });
    const token = await this.getPasswordResetToken(resetToken);
    return token.user;
  };

  handlePasswordUpdate = async () => {
    const { resetToken } = this.req.params;
    const { password } = this.req.body;
    const token = await this.getPasswordResetToken(resetToken);
    const hashedPass = bcrypt.hashSync(
      password,
      Number(process.env.BCRYPT_SALT)
    );
    await token.user.update({ password: hashedPass });
    await token.destroy();
    return null;
  };

  async getPasswordResetToken(resetToken) {
    const token = await db.PasswordReset.findOne({
      where: { resetToken },
      include: {
        model: db.User,
        as: 'user',
        attributes: { exclude: 'password' },
      },
    });

    if (!token) {
      // token not found in the db
      this.throwError({
        status: 400,
        err: 'invalid token',
        errorCode: 'PRT002',
      });
    }

    if (token && token.expires < Date.now()) {
      // token has expired
      this.throwError({
        status: 400,
        err: 'invalid token',
        errorCode: 'PRT003',
      });
    }

    return token;
  }

  async handleAuthorization(permittedRoles) {
    const { authorization: token } = this.req.headers;
    if (!token) {
      // no authorization token provided in req headers
      this.throwError({
        status: 401,
        err: 'access denied',
        errorCode: 'AUTH001',
      });
    }

    const decodedToken = Jwt.verifyToken(token);
    if (!decodedToken) {
      // invalid jwt token; failed to decode token with our jwt_secret
      this.throwError({
        status: 401,
        err: 'access denied',
        errorCode: 'AUTH002',
      });
    }

    const isValidUUID = this.validateUUID(decodedToken.subject);
    if (!isValidUUID) {
      // token contains an invalid uuid as subject
      this.throwError({
        status: 401,
        err: 'access denied',
        errorCode: 'AUTH003',
      });
    }

    if (!permittedRoles.includes(decodedToken.role)) {
      // user not allowed access; resource is classified
      this.throwError({
        status: 401,
        err: 'access denied',
        errorCode: 'AUTH004',
      });
    }

    if (
      permittedRoles.includes(accountOwner) &&
      decodedToken.role == roles.user
    ) {
      const { username } = this.req.params;
      if (!username) {
        this.throwError({
          status: 500,
          err:
            'invalid authorization setting, accountOwner role is not allowed when "username" is missing in params',
        });
      }
      if (username !== decodedToken.username) {
        // username does not match the resource owner's username, and role is not admin or superadmin
        this.throwError({
          status: 401,
          err: 'access denied',
          errorCode: 'AUTH005',
        });
      }
    }
    return true;
  }

  validateUUID = (value) => {
    const schema = Joi.object({
      uuid: Joi.string().guid({
        version: ['uuidv4', 'uuidv5'],
      }),
    });
    const { error } = schema.validate({ uuid: value });
    return error ? false : true;
  };
}
