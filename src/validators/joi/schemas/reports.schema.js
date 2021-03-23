import { Joi } from '../config';

export const reportSettings = Joi.object({
  approve: Joi.bool(),
  pay: Joi.bool().valid(true),
  audit: Joi.bool(),
});
