import Joi from '@hapi/joi';
import { validateSchema } from '../helpers';
import AppMiddleware from '../app/app.middleware';

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
export const USERNAME_REGEX = /^[a-zA-Z0-9_-]*$/;

export default class UserMiddleware extends AppMiddleware {
  static async validateNewUser(req, res, next) {
    try {
      const newUserSchema = Joi.object({
        email: Joi.string().email().trim().required(),
        username: Joi.string().regex(USERNAME_REGEX).min(4).max(16).required(),
        password: Joi.string().regex(PASSWORD_REGEX).required(),
        firstName: Joi.string().trim().min(2).max(16).required(),
        lastName: Joi.string().trim().min(2).max(16),
        image: Joi.string().trim(),
      });
      const error = await validateSchema(newUserSchema, req);
      if (error) return res.status(400).json({ error });

      return next();
    } catch (error) {
      return next(error.message);
    }
  }

  static async validateEmail(req, res, next) {
    try {
      const emailSchema = Joi.object({
        email: Joi.string().email().trim().required(),
      });
      const error = await validateSchema(emailSchema, req);
      if (error) return res.status(400).json({ error });
      return next();
    } catch (error) {
      return next(error.message);
    }
  }
}
