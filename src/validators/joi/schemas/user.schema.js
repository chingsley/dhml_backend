import {
  Joi,
  stringValidate,
  validateIntegerId,
  validateEmail,
} from '../config';

// export const newUserSchema = Joi.object({
//   staffId: Joi.number().integer().min(1).required(),
//   email: Joi.string().email().trim().required(),
//   username: Joi.string().trim(),
//   roleId: Joi.number().min(1).required(),
//   returnPassword: Joi.number().valid(0, 1).default(0),
// });

export const getUserSchema = ({ withRequiredFields = true }) => {
  return Joi.object({
    staffId: validateIntegerId(withRequiredFields),
    email: validateEmail(withRequiredFields),
    username: stringValidate(withRequiredFields),
    roleId: validateIntegerId(withRequiredFields),
    returnPassword: Joi.number().valid(0, 1).default(0),
  });
};
