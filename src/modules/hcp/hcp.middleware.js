import Joi from '@hapi/joi';
import { throwError } from '../../shared/helpers';
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
        hcpCode: Joi.string().trim(),
        hcpName: Joi.string().trim(),
      });
      await validateSchema(querySchema, req.query);
      const { hcpCode, hcpName } = req.query;
      console.log(hcpCode, 'this = ', this);
      HcpMiddleware.rejectSpecialCharacters([hcpCode, hcpName]);
      return next();
    } catch (error) {
      Response.handleError('validateQuery', error, req, res, next);
    }
  }

  static rejectSpecialCharacters(fields) {
    for (let field of fields) {
      const reg = /[ `!#$%^&*()+=[\]{};':",.<>?~]/;
      if (field && reg.test(field)) {
        throwError({
          status: 400,
          error: [
            'invalid search param. Please ensure your search parameter does not include special characters',
          ],
        });
      }
    }
  }
}
