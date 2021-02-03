import { Joi } from '../config';

export const loginSchema = Joi.object({
  password: Joi.string().trim().required(),
  loginType: Joi.string().trim().valid('user', 'hcp').required(),
  email: Joi.when('loginType', {
    is: 'user',
    then: Joi.string().trim().required(),
    otherwise: Joi.string().trim(),
  }),
  username: Joi.when('loginType', {
    is: 'hcp',
    then: Joi.string().trim().required(),
    otherwise: Joi.string().trim(),
  }),
});

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^_&*])(?=.{8,})/;
export const passwordChangeSchema = Joi.object({
  oldPassword: Joi.string().trim().required(),
  newPassword: Joi.string().regex(PASSWORD_REGEX).required(),
});
