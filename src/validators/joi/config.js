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
  };
  try {
    const joiFormatted = await schema.validateAsync(payload);
    // console.log('>>>>>>>. joiFormatted = ', joiFormatted);
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

// function throwError(errorObj) {
//   throw new Error(JSON.stringify(errorObj));
// }

export default { Joi, validateSchema };
