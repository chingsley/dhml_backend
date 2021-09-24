import { USERTYPES } from '../../../shared/constants/lists.constants';
import { Joi } from '../config';

export const login = Joi.object({
  password: Joi.string().trim().required(),
  userType: Joi.string()
    .trim()
    .valid(...Object.values(USERTYPES))
    .required(),
  email: Joi.when('userType', {
    is: USERTYPES.USER,
    then: Joi.string().trim().required(),
    otherwise: Joi.string().trim(),
  }),
  username: Joi.when('userType', {
    is: USERTYPES.HCP,
    then: Joi.string().trim().required(),
    otherwise: Joi.string().trim(),
  }),
});

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^_&*])(?=.{8,})/;

export const passwordChange = Joi.object({
  oldPassword: Joi.string().trim().required(),
  newPassword: Joi.string().trim().regex(PASSWORD_REGEX).required(),
});

const passwordResetComplete = Joi.object({
  password: Joi.string().trim().regex(PASSWORD_REGEX).required(),
  email: Joi.string().trim().email().required(),
  userType: Joi.string()
    .trim()
    .valid(...Object.values(USERTYPES)),
});

const resendDefaultPass = Joi.object({
  email: Joi.string().email().trim().required(),
  userType: Joi.string()
    .trim()
    .required()
    .valid(...Object.values(USERTYPES)),
  returnPassword: Joi.bool().valid(true, false),
});

const requestPasswordReset = Joi.object({
  email: Joi.string().email().trim().required(),
  userType: Joi.string()
    .trim()
    .required()
    .valid(...Object.values(USERTYPES)),
});

const authSchema = {
  resendDefaultPass,
  login,
  passwordChange,
  requestPasswordReset,
  passwordResetComplete,
};

export default authSchema;
