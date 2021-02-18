import { BASIC, SUPERADMIN } from '../../shared/constants/roles.constants';
import Response from '../../utils/Response';
import RoleService from './role.services';

export default class RoleController {
  static async getAllRoles(req, res, next) {
    try {
      let data;
      const roleService = new RoleService(req);
      const { user } = req;
      if (user.role.title === SUPERADMIN) {
        data = await roleService.fetchAllRoles();
      } else {
        data = await roleService.findAllWhere({ title: BASIC });
      }
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('getAllRoles', error, req, res, next);
    }
  }
}
