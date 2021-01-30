// import Joi from '@hapi/joi';
import { throwError } from '../../shared/helpers';
import Response from '../../utils/Response';
import { Joi, validateSchema } from '../../validators/joi/config';

export default class HcpMiddleware {
  static async validateStatusUpdate(req, res, next) {
    try {
      const schema = Joi.object({
        status: Joi.string().trim().valid('suspended', 'activated').required(),
        enrolleeIds: Joi.array()
          .items(Joi.string().trim())
          .min(1)
          .unique()
          .required(),
      });
      const { joiFormatted } = await validateSchema(schema, req.body);
      req.body = joiFormatted;
      // return res.send('testing...');
      return res.status(200).json(req.body);
      // return next();
    } catch (error) {
      Response.handleError('validateStatusUpdate', error, req, res, next);
    }
  }
  static async validateQuery(req, res, next) {
    try {
      const querySchema = Joi.object({
        page: Joi.number().integer().min(0),
        pageSize: Joi.number().integer().min(1),
        code: Joi.string().trim(),
        name: Joi.string().trim(),
        hcpCode: Joi.string().trim(),
        hcpName: Joi.string().trim(),
        value: Joi.string().trim(),
        date: Joi.date()
          .format('YYYY-MM-DD')
          .max('now')
          .error(
            new Error(
              'date filter must have the format YYYY-MM-DD and cannot be in the future'
            )
          ),
      });
      await validateSchema(querySchema, req.query);
      const { hcpCode, hcpName, value } = req.query;
      HcpMiddleware.rejectSpecialCharacters([hcpCode, hcpName, value]);
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
