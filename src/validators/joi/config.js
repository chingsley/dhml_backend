/* eslint-disable quotes */
import JoiBase from '@hapi/joi';
import JoiDate from '@hapi/joi-date';
import { throwError } from '../../shared/helpers';

export const Joi = JoiBase.extend(JoiDate);

export const validateSchema = async (schema, payload, subject = '') => {
  const errorDict = {
    username: `invalid username. Username can only consist of lowercase letters, numbers, a dash and/or an underscore`,
    password: `password must be a minimum of 8 characters long, must contain a lowercase, an uppercase, a number and a special character`,
    newPassword: `New password must be a minimum of 8 characters long, must contain a lowercase, an uppercase, a number and a special character`,
    dateOfBirth: 'date of birth cannot be in the future',
    accountNumber: `Invalid account number. Account number cannot contain letters`,
    referalCode: `Invalid Referal Code, please check the code and try again. REFC001`,
  };
  try {
    const joiFormatted = await schema.validateAsync(payload);
    return { joiFormatted };
  } catch (error) {
    if (error.details?.[0].type?.match(/string.pattern.base/i)) {
      throwError({
        status: 400,
        error: [`${subject}${errorDict[error.details[0].context.key]}`],
      });
    } else {
      throwError({
        status: 400,
        error: [`${subject}${[error.message]}`],
        // error: [error.message],
      });
    }
  }
};

export function stringValidate(withRequiredFields) {
  return withRequiredFields
    ? Joi.string().trim().required()
    : Joi.string().trim();
}

export function numberValidate(withRequiredFields) {
  return withRequiredFields ? Joi.number().required() : Joi.number();
}
export function dateValidate(withRequiredFields) {
  return withRequiredFields ? Joi.date().required() : Joi.date();
}

export function validateIntegerId(withRequiredFields) {
  return withRequiredFields
    ? Joi.number().min(1).required()
    : Joi.number().min(1);
}

export function validateEmail(withRequiredFields) {
  return withRequiredFields
    ? Joi.string().email().trim().required()
    : Joi.string().email().trim();
}

export const uuidSchema = Joi.string().guid({
  version: ['uuidv4', 'uuidv5'],
});
