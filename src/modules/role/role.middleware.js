import Joi from '@hapi/joi';
import { validateSchema } from '../helpers';

export default class RoleMiddleware {
  static async validateRole(req, res, next) {
    try {
      const newUserSchema = Joi.object({
        name: Joi.string()
          .trim()
          .valid('superadmin', 'admin', 'user')
          .required(),
        id: Joi.number().integer().min(1),
      });
      const error = await validateSchema(newUserSchema, req);
      if (error) return res.status(400).json({ error });
      return next();
    } catch (error) {
      return next(error.message);
    }
  }

  static async validateRoleId(req, res, next) {
    try {
      const roleIdSchema = Joi.object({
        id: Joi.number().integer().min(1),
      });
      const error = await validateSchema(roleIdSchema, req);
      if (error) return res.status(400).json({ error });
      return next();
    } catch (error) {
      return next(error.message);
    }
  }
}
