import Response from '../../utils/Response';
import { validateSchema } from '../../validators/joi/config';
import { newUserSchema } from '../../validators/joi/schemas/user.schema';

export default class UserMiddleware {
  static async validateNewUser(req, res, next) {
    try {
      const { joiFormatted } = await validateSchema(newUserSchema, req.body);
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateNewUser', error, req, res, next);
    }
  }
}
