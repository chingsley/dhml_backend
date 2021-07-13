// import Joi from '@hapi/joi';
import { throwError } from '../../shared/helpers';
import Response from '../../utils/Response';
import { Joi, validateSchema } from '../../validators/joi/config';

export default class FFSMiddleware {
  static async validateQuery(req, res, next) {
    try {
      const querySchema = Joi.object({
        id: Joi.number().integer().min(1),
        page: Joi.number().integer().min(0),
        pageSize: Joi.number().integer().min(1),
        hcpCode: Joi.string().trim(),
        hcpName: Joi.string().trim(),
        category: Joi.string().trim(),
        date: Joi.date()
          .format('YYYY-MM-DD')
          .max('now')
          .error(
            new Error(
              'date filter must have the format YYYY-MM-DD and cannot be in the future'
            )
          ),
      });
      const { joiFormatted } = await validateSchema(querySchema, req.query);
      const { hcpCode, hcpName } = req.query;
      FFSMiddleware.rejectSpecialCharacters([hcpCode, hcpName]);
      req.query = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateQuery', error, req, res, next);
    }
  }

  static rejectSpecialCharacters(fields) {
    for (let field of fields) {
      const reg = /[`!#$%^&*()+=[\]{};':"<>?~]/;
      const match = field && field.match(reg);
      if (match) {
        throwError({
          status: 400,
          error: [
            `invalid search parameter. Character "${match[0]}" is not allowed `,
          ],
        });
      }
    }
  }
}
