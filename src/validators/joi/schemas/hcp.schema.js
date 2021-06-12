import { Joi, stringValidate, numberValidate } from '../config';

export const getHcpSchema = ({ withRequiredFields = true, req = {} }) => {
  const defaultSpecialtyIds = req.method === 'POST' ? [] : null;
  return Joi.object({
    code: stringValidate(withRequiredFields),
    name: stringValidate(withRequiredFields),
    category: stringValidate(withRequiredFields),
    state: stringValidate(withRequiredFields),
    address: stringValidate(withRequiredFields),
    email: stringValidate(withRequiredFields),
    phoneNumber: stringValidate(withRequiredFields),
    alternativePhoneNumber: Joi.string().trim(),
    bank: stringValidate(withRequiredFields),
    bankAddress: Joi.string().trim(),
    armOfService: Joi.string().trim(),
    geopoliticalZone: Joi.string().trim(),
    accountNumber: numberValidate(withRequiredFields),
    accountType: stringValidate(withRequiredFields),
    returnPassword: Joi.bool().valid(true, false),
    specialtyIds: Joi.array()
      .items(
        Joi.string().guid({
          version: ['uuidv4', 'uuidv5'],
        })
      )
      .default(defaultSpecialtyIds),
  });
};
