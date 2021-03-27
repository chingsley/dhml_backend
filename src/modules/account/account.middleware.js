import { Joi, validateSchema } from '../../validators/joi/config';
import Response from '../../utils/Response';

export default class AccountMiddleware {
  static async validateDateQuery(req, res, next) {
    try {
      const schema = Joi.object({
        date: Joi.date().format('YYYY-MM-DD').max('now').required(),
      });
      await validateSchema(schema, req.query);
      return next();
    } catch (error) {
      Response.handleError('validateDateQuery', error, req, res, next);
    }
  }
}
