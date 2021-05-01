import Response from '../../utils/Response';
import DevService from './dev.services';

export default class DevController {
  static async updateDependant(req, res, next) {
    try {
      const devService = new DevService(req);
      const data = await devService.updateDependantInfo();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('updateDependant', error, req, res, next);
    }
  }
  static async addNewRole(req, res, next) {
    try {
      const devService = new DevService(req);
      const data = await devService.updateOrCreateRole();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('addNewRole', error, req, res, next);
    }
  }
}
