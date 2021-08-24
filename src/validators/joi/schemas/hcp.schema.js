import { Joi, stringValidate, numberValidate } from '../config';

export const getHcpSchema = ({ withRequiredFields = true, req = {} }) => {
  const defaultSpecialtyIds = req.method === 'POST' ? [] : null;
  return Joi.object({
    code: stringValidate(withRequiredFields),
    name: stringValidate(withRequiredFields),
    category: stringValidate(withRequiredFields),
    state: stringValidate(withRequiredFields),
    address: Joi.string().trim(),
    email: Joi.string().email(),
    phoneNumber: Joi.string().trim(),
    alternativePhoneNumber: Joi.string().trim(),
    bank: stringValidate(withRequiredFields),
    bankAddress: Joi.string().trim(),
    armOfService: Joi.string().trim(),
    geopoliticalZone: Joi.string().trim(),
    accountNumber: numberValidate(withRequiredFields),
    accountName: stringValidate(withRequiredFields),
    accountType: Joi.string().trim(),
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
