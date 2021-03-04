import { Joi, stringValidate, validateIntegerId } from '../config';

export const getUserSchema = ({ withRequiredFields = true }) => {
  return Joi.object({
    staffId: validateIntegerId(withRequiredFields),
    username: stringValidate(withRequiredFields),
    roleId: validateIntegerId(withRequiredFields),
    returnPassword: Joi.number().valid(0, 1).default(0),
  });
};

export const schemaUserIdArr = Joi.object({
  userIds: Joi.array()
    .items(Joi.number().integer().min(1))
    .min(1)
    .unique()
    .required(),
});
