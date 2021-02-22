import { Joi, stringValidate, validateIntegerId } from '../config';

export const getUserSchema = ({ withRequiredFields = true }) => {
  return Joi.object({
    staffId: validateIntegerId(withRequiredFields),
    username: stringValidate(withRequiredFields),
    roleId: validateIntegerId(withRequiredFields),
    returnPassword: Joi.number().valid(0, 1).default(0),
  });
};
