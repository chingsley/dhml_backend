import { Joi, validateSchema } from '../../validators/joi/config';
import Response from '../../utils/Response';

export default class AccountMiddleware {
  static async validateTsaRemitaUpdate(req, res, next) {
    try {
      const schema = Joi.object({
        tsaCharge: Joi.number(),
        rrr: Joi.string().trim(),
      });
      const { joiFormatted } = await validateSchema(schema, req.body);
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateTsaRemitaUpdate', error, req, res, next);
    }
  }
}
