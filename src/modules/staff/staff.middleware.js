import Response from '../../utils/Response';
import { validateSchema } from '../../validators/joi/config';
import {
  getStaffSchema,
  staffQuerySchema,
} from '../../validators/joi/schemas/staff.schema';

export default class StaffMiddleware {
  static async validateNewStaff(req, res, next) {
    try {
      const newStaffSchema = getStaffSchema({ withRequiredFields: true });
      const { joiFormatted } = await validateSchema(newStaffSchema, req.body);
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateNewStaff', error, req, res, next);
    }
  }
  static async validateStaffUpdate(req, res, next) {
    try {
      const newStaffSchema = getStaffSchema({ withRequiredFields: false });
      const { joiFormatted } = await validateSchema(newStaffSchema, req.body);
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateStaffUpdate', error, req, res, next);
    }
  }
  static async validateStaffQuery(req, res, next) {
    try {
      await validateSchema(staffQuerySchema, req.query);
      return next();
    } catch (error) {
      Response.handleError('validateStaffQuery', error, req, res, next);
    }
  }
}
