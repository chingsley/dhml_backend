import { Joi } from '../config';

export const loginSchema = Joi.object({
  email: Joi.string().trim().required(),
  password: Joi.string().trim().required(),
});

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^_&*])(?=.{8,})/;
export const passwordChangeSchema = Joi.object({
  oldPassword: Joi.string().trim().required(),
  newPassword: Joi.string().regex(PASSWORD_REGEX).required(),
});
