import Response from '../../utils/Response';
import StaffService from './staff.services';

export default class StaffController {
  static async addNewStaff(req, res, next) {
    try {
      const staffService = new StaffService(req);
      const data = await staffService.createNewStaff();
      return res.status(201).json({ data });
    } catch (error) {
      // console.log(error);
      Response.handleError('addNewStaff', error, req, res, next);
    }
  }
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
