import Response from '../../utils/Response';
import { validateSchema } from '../../validators/joi/config';
import {
  getUserSchema,
  schemaUserIdArr,
} from '../../validators/joi/schemas/user.schema';

export default class UserMiddleware {
  static async validateNewUser(req, res, next) {
    try {
      const newUserSchema = getUserSchema({ withRequiredFields: true });
      const { joiFormatted } = await validateSchema(newUserSchema, req.body);
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateNewUser', error, req, res, next);
    }
  }
  static async validateUserUpdate(req, res, next) {
    try {
      const schemaUserUpdate = getUserSchema({ withRequiredFields: false });
      const { joiFormatted } = await validateSchema(schemaUserUpdate, req.body);
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateNewUser', error, req, res, next);
    }
  }

  static validateUserIdArr = async (req, res, next) => {
    try {
      const { joiFormatted } = await validateSchema(schemaUserIdArr, req.body);
      req.body = joiFormatted;
      return next();
    } catch (error) {
      return Response.handleError('validateUserIdArr', error, req, res, next);
    }
  };
}
