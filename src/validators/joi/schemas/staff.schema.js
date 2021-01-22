import { Joi } from '../config';

export const staffQuerySchema = Joi.object({
  unregisteredOnly: Joi.string().trim().valid('true', 'false'),
  pageSize: Joi.number().integer().min(1),
  page: Joi.number().integer().min(0),
  staffFileNo: Joi.string().trim(),
  staffIdNo: Joi.string().trim(),
  surname: Joi.string().trim(),
  firstName: Joi.string().trim(),
  middleName: Joi.string().trim(),
  stateOfOrigin: Joi.string().trim(),
  phoneNumber: Joi.string().trim(),
  designation: Joi.string().trim(),
  deployment: Joi.string().trim(),
  location: Joi.string().trim(),
  pfa: Joi.string().trim(),
});
