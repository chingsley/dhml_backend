import { Joi, validateSchema } from '../../validators/joi/config';
import Response from '../../utils/Response';
import { getVoucherSchema } from '../../validators/joi/schemas/accounts.schema';

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
  static async validateVoucher(req, res, next) {
    try {
      const { joiFormatted } = await validateSchema(
        getVoucherSchema(),
        req.body
      );
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateVoucher', error, req, res, next);
    }
  }
}
