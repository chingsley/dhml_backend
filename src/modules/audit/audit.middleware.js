import Response from '../../utils/Response';
import { validateSchema, Joi } from '../../validators/joi/config';

export default class AuditLogMiddleware {
  static async validateAuditLogQuery(req, res, next) {
    try {
      const querySchema = Joi.object({
        name: Joi.string().trim(),
        pageSize: Joi.number().integer().min(1),
        page: Joi.number().integer().min(0),
        date: Joi.date().format('YYYY-MM-DD').max('now'),
      });
      const { joiFormatted } = await validateSchema(querySchema, req.query);
      req.query = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateAuditLogQuery', error, req, res, next);
    }
  }
}
