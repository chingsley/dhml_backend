// import Joi from '@hapi/joi';
import { throwError } from '../../shared/helpers';
import Response from '../../utils/Response';
import { Joi, validateSchema } from '../../validators/joi/config';
import { getHcpSchema } from '../../validators/joi/schemas/hcp.schema';

export default class HcpMiddleware {
  static async validateNewHcp(req, res, next) {
    try {
      const hcpSchema = getHcpSchema({ withRequiredFields: true, req });
      const { joiFormatted } = await validateSchema(hcpSchema, req.body);
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateNewHcp', error, req, res, next);
    }
  }
  static async validateHcpUpdate(req, res, next) {
    try {
      const hcpSchema = getHcpSchema({ withRequiredFields: false, req });
      const { joiFormatted } = await validateSchema(hcpSchema, req.body);
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateHcpUpdate', error, req, res, next);
    }
  }
  static async validateStatusUpdate(req, res, next) {
    try {
      const schema = Joi.object({
        status: Joi.string().trim().valid('suspended', 'active').required(),
        hcpIds: Joi.array()
          .items(Joi.number().integer())
          .min(1)
          .unique()
          .required(),
      });
      const { joiFormatted } = await validateSchema(schema, req.body);
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateStatusUpdate', error, req, res, next);
    }
  }
  static async validateQuery(req, res, next) {
    try {
      const querySchema = Joi.object({
        id: Joi.number().integer().min(1),
        page: Joi.number().integer().min(0),
        pageSize: Joi.number().integer().min(1),
        code: Joi.string().trim(),
        name: Joi.string().trim(),
        email: Joi.string().trim(),
        hcpCode: Joi.string().trim(),
        hcpName: Joi.string().trim(),
        searchField: Joi.string().trim(),
        searchValue: Joi.string().trim(),
        searchItem: Joi.string().trim(),
        category: Joi.string().trim(),
        specialtyId: Joi.string().trim(),
        state: Joi.string().trim(),
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
      const { hcpCode, hcpName, searchItem } = req.query;
      HcpMiddleware.rejectSpecialCharacters([hcpCode, hcpName, searchItem]);
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
