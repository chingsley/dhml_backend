import db from '../../database/models';
import {
  AUTH003,
  ACCOUNT_NOT_FOUND_ERROR,
  AUTH004,
  ACCESS_DENIED,
  AUTH001,
  NO_DEFAULT_PASSWORD_USER,
  NO_EXPIRED_PASSWORD,
} from '../../shared/constants/errors.constants';
import { throwError } from '../../shared/helpers';
import { isExpired } from '../../utils/helpers';
import Jwt from '../../utils/Jwt';
import Response from '../../utils/Response';
import { validateSchema } from '../../validators/joi/config';
import {
  loginSchema,
  passwordChangeSchema,
} from '../../validators/joi/schemas/auth.schema';

export default class AuthMiddleware {
  static async validateLoginDetails(req, res, next) {
    try {
      const { joiFormatted } = await validateSchema(loginSchema, req.body);
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateLoginDetails', error, req, res, next);
    }
  }

  static async validatepasswordChangeDetails(req, res, next) {
    try {
      const { joiFormatted } = await validateSchema(
        passwordChangeSchema,
        req.body
      );
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError(
        'validatepasswordChangeDetails',
        error,
        req,
        res,
        next
      );
    }
  }

  /**
   *
   * @param {array} allowedRoles
   * contains array of roles that are allowed
   * to access the endpoint. e.g .authorzie(['admin', 'superadmin])
   * If allowedRoles is not specified (undefined),
   * e.g AuthMiddleware.authorize() then anyone
   * with a valid token can acccess the endpoint
   */
  static authorize(allowedRoles, options = {}) {
    return async (req, res, next) => {
      try {
        const {
          rejectDefaultPassword = true,
          rejectExpiredPassword = false,
        } = options;
        const { userId, hcpId } = this.verifyToken(req.headers);
        let user, hcp;
        if (userId) user = await this.findUserById(userId);
        if (hcpId) hcp = await this.findHcpById(hcpId);
        const { password, role } = user ? user : hcp;
        if (rejectDefaultPassword) this.rejectDefaultPassword(password);
        if (rejectExpiredPassword) this.rejectExpiredPassword(password);
        this.authorizeUser(role, allowedRoles);
        req.user = user;
        req.hcp = hcp;
        return next();
      } catch (error) {
        return Response.handleError('authorize', error, req, res, next);
      }
    };
  }

  static findUserById(userId) {
    return db.User.findOneWhere(
      { id: userId },
      {
        include: [
          { model: db.Role, as: 'role' },
          { model: db.Password, as: 'password' },
        ],
        throwErrorIfNotFound: true,
        errorMsg: ACCOUNT_NOT_FOUND_ERROR,
        errorCode: AUTH003,
      }
    );
  }

  static findHcpById(hcpId) {
    return db.HealthCareProvider.findOneWhere(
      { id: hcpId },
      {
        include: [
          { model: db.Role, as: 'role' },
          { model: db.Password, as: 'password' },
        ],
        throwErrorIfNotFound: true,
        errorMsg: ACCOUNT_NOT_FOUND_ERROR,
        errorCode: AUTH003,
        status: 401,
      }
    );
  }

  static verifyToken = (reqHeaders) => {
    const token = reqHeaders.authorization;
    if (!token) {
      throwError({
        status: 401,
        error: [ACCESS_DENIED],
        errorCode: AUTH001,
      });
    }
    const { userId, hcpId } = Jwt.decode(token);
    return { userId, hcpId };
  };

  static rejectDefaultPassword = (password) => {
    if (password.isDefaultValue) {
      throwError({
        status: 401,
        error: [NO_DEFAULT_PASSWORD_USER],
      });
    }
  };
  static rejectExpiredPassword = (password) => {
    if (isExpired(password.expiryDate)) {
      throwError({
        status: 401,
        error: [NO_EXPIRED_PASSWORD],
      });
    }
  };

  static authorizeUser(userRole, allowedRoles) {
    //if there is no list of allowed roles, then any role is allowed
    // and all users are authorized
    if (!allowedRoles) return true;

    // if there is a list of allowed roles and userRole is
    // not in that list then user is not authorized
    if (!allowedRoles.includes(userRole.title)) {
      throwError({
        status: 401,
        error: [ACCESS_DENIED],
        errorCode: AUTH004,
      });
    }
    return true;
  }
}
