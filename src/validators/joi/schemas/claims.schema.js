import { Joi } from '../config';
import { VALID_REF_CODE } from './refcode.schema';

export const newClaimSchema = Joi.object({
  referalCode: Joi.string().regex(VALID_REF_CODE),
  claims: Joi.array().items(
    Joi.object({
      category: Joi.string().trim().lowercase().required(),
      serviceName: Joi.when('category', {
        is: 'drug',
        then: Joi.forbidden(),
        otherwise: Joi.string().trim().required(),
      }),
      drugDosageForm: Joi.when('category', {
        is: 'drug',
        then: Joi.string().trim(),
        otherwise: Joi.forbidden(),
      }),
      drugStrength: Joi.when('category', {
        is: 'drug',
        then: Joi.string().trim(),
        otherwise: Joi.forbidden(),
      }),
      drugPresentation: Joi.when('category', {
        is: 'drug',
        then: Joi.string().trim(),
        otherwise: Joi.forbidden(),
      }),
      unit: Joi.number().integer().min(1).required(),
      pricePerUnit: Joi.number().min(0).required(),
    })
  ),
});
