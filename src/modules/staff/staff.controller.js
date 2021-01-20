import Response from '../../utils/Response';
import StaffService from './staff.services';

export default class StaffController {
  static async getAllStaff(req, res, next) {
    try {
      const staffService = new StaffService(req);
      const data = await staffService.fetchAllStaff();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('getAllStaff', error, req, res, next);
    }
  }
}
