import RoleService from './role.services';
import AppController from '../app/app.controller';

export default class RoleController extends AppController {
  static async addNewRole(req, res, next) {
    try {
      const roleService = new RoleService(req, res);
      const role = await roleService.create(req.body);
      return res.status(201).json({
        message: 'role successfully created',
        data: role,
      });
    } catch (error) {
      RoleController.handleError(error, req, res, next);
    }
  }

  static async updateRole(req, res, next) {
    try {
      const roleService = new RoleService(req, res);
      const { id, name, updatedAt } = await roleService.update(
        req.params.id,
        req.body
      );
      return res.status(200).json({
        message: 'role successfully updated',
        data: { id, name, updatedAt },
      });
    } catch (error) {
      RoleController.handleError(error, req, res, next);
    }
  }

  static async deleteRole(req, res, next) {
    try {
      const roleService = new RoleService(req, res);
      const { id } = req.params;
      await roleService.remove(id);
      return res.status(200).json({ message: 'role successfully deleted' });
    } catch (error) {
      RoleController.handleError(error, req, res, next);
    }
  }
}
