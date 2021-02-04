import { Joi } from '../config';

export const login = Joi.object({
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
export const passwordChange = Joi.object({
  oldPassword: Joi.string().trim().required(),
  newPassword: Joi.string().regex(PASSWORD_REGEX).required(),
});

const resendDefaultPass = Joi.object({
  email: Joi.string().trim().required(),
  authType: Joi.string().trim().required().valid('user', 'hcp'),
  returnPassword: Joi.bool().valid(true, false),
});

const authSchema = {
  resendDefaultPass,
  login,
  passwordChange,
};

export default authSchema;
