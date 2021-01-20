import Response from '../../utils/Response';
import { validateSchema } from '../../validators/joi/config';
import { staffQuerySchema } from '../../validators/joi/schemas/staff.schema';

export default class StaffMiddleware {
  static async validateStaffQuery(req, res, next) {
    try {
      await validateSchema(staffQuerySchema, req.query);
      return next();
    } catch (error) {
      Response.handleError('validateQuery', error, req, res, next);
    }
  }
}
