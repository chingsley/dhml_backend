import { Joi } from '../config';

export const newUserSchema = Joi.object({
  staffIdNo: Joi.string().trim().required(),
  email: Joi.string().email().trim().required(),
  username: Joi.string().trim(),
  roleId: Joi.number().min(1).required(),
});
