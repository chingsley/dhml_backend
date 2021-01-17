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

  // static authorize(arrayOfPermittedRoles) {
  //   return async (req, res, next) => {
  //     try {
  //       const authService = new AuthService(req, res);
  //       await authService.handleAuthorization(arrayOfPermittedRoles);
  //       return next();
  //     } catch (error) {
  //       return AppMiddleware.handleError(error, req, res, next);
  //     }
  //   };
  // }
}
