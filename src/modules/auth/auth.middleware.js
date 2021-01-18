import db from '../../database/models';
import {
  ACCOUNT_NOT_FOUND_CODE,
  ACCOUNT_NOT_FOUND_ERROR,
  AUTH004,
  ACCESS_DENIED,
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

  static verifyToken = async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res
          .status(401)
          .json({ error: 'access denied', errorCode: 'AUTH001' });
      }
      const { subject: userId } = Jwt.decode(token);

      req.userId = userId;
      next();
    } catch (error) {
      Response.handleError('verifyToken', error, req, res, next);
    }
  };

  static authorize(arrayOfPermittedRoles) {
    return async (req, res, next) => {
      try {
        const { userId } = req;
        const user = await db.User.findOneWhere(
          { id: userId },
          {
            include: { model: db.Role, as: 'role' },
            throwErrorIfNotFound: true,
            errorMsg: ACCOUNT_NOT_FOUND_ERROR,
            errorCode: ACCOUNT_NOT_FOUND_CODE,
          }
        );
        // // password change feature is not ready on the frontend
        // if (!user.hasChangedDefaultPassword) {
        //   throwError({
        //     status: 401,
        //     error: NO_DEFAULT_PASSWORD_USER,
        //   });
        // }
        const { role: userRole } = user;
        if (!arrayOfPermittedRoles.includes(userRole.title)) {
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
}