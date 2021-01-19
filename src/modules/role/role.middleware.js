import Joi from '@hapi/joi';
import Response from '../../utils/Response';
import { validateSchema } from '../../validators/joi/config';

export default class RoleMiddleware {
  static async validateQuery(req, res, next) {
    try {
      const querySchema = Joi.object({
        title: Joi.string().trim(),
        pageSize: Joi.number().integer().min(1),
        page: Joi.number().integer().min(0),
      });
      const { joiFormatted } = await validateSchema(querySchema, req.query);
      req.query = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateQuery', error, req, res, next);
    }
  }
}
