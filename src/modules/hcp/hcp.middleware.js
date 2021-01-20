import Joi from '@hapi/joi';
import Response from '../../utils/Response';
import { validateSchema } from '../../validators/joi/config';

export default class HcpMiddleware {
  static async validateQuery(req, res, next) {
    try {
      const querySchema = Joi.object({
        page: Joi.number().integer().min(0),
        pageSize: Joi.number().integer().min(1),
        code: Joi.string().trim(),
        name: Joi.string().trim(),
      });
      await validateSchema(querySchema, req.query);
      return next();
    } catch (error) {
      Response.handleError('validateQuery', error, req, res, next);
    }
  }
}
