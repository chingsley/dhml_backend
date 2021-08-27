import Response from '../../utils/Response';
import RoleService from './role.services';

export default class RoleController {
  static async getAllRoles(req, res, next) {
    try {
      const roleService = new RoleService(req);
      const data = await roleService.fetchAllRoles();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('getAllRoles', error, req, res, next);
    }
  }
}
