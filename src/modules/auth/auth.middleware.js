import db from '../../database/models';
import {
  AUTH003,
  ACCOUNT_NOT_FOUND_ERROR,
  AUTH004,
  ACCESS_DENIED,
  AUTH001,
  NO_DEFAULT_PASSWORD_USER,
} from '../../shared/constants/errors.constants';
import { throwError } from '../../shared/helpers';
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
      Response.handleError('validateLoginDetails', error, req, res, next);
    }
  }

  static authorizeUserWithValidToken(req, res, next) {
    try {
      this.verifyToken(req.headers);
      return next();
    } catch (error) {
      return Response.handleError(
        'authorizeUserWithValidToken',
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
  static authorize(allowedRoles) {
    return async (req, res, next) => {
      try {
        const { userId } = this.verifyToken(req.headers);
        const user = await db.User.findOneWhere(
          { id: userId },
          {
            include: { model: db.Role, as: 'role' },
            throwErrorIfNotFound: true,
            errorMsg: ACCOUNT_NOT_FOUND_ERROR,
            errorCode: AUTH003,
          }
        );
        this.rejectDefaultPasswordUser(user);
        const { role: userRole } = user;
        if (!allowedRoles) return next();
        if (!allowedRoles.includes(userRole.title)) {
          throwError({
            status: 401,
            error: ACCESS_DENIED,
            errorCode: AUTH004,
          });
        }
        return next();
      } catch (error) {
        return Response.handleError('authorize', error, req, res, next);
      }
    };
  }

  static verifyToken = (reqHeaders) => {
    const token = reqHeaders.authorization;
    if (!token) {
      throwError({
        status: 401,
        error: ACCESS_DENIED,
        errorCode: AUTH001,
      });
    }
    const { subject: userId } = Jwt.decode(token);
    return { userId };
  };

  static rejectDefaultPasswordUser = (user) => {
    if (!user.hasChangedDefaultPassword) {
      throwError({
        status: 401,
        error: NO_DEFAULT_PASSWORD_USER,
      });
    }
  };
}
