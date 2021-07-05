import { SERVICE_CATEGORIES } from '../../../shared/constants/services.constants';
import { Joi, uuidSchema } from '../config';
import { VALID_REF_CODE } from './refcode.schema';

const newClaimReqBody = {
  category: Joi.string().trim().lowercase().required(),
  serviceName: Joi.when('category', {
    is: 'drug',
    then: Joi.forbidden(),
    otherwise: Joi.string().trim().required(),
  }),
  drugName: Joi.when('category', {
    is: 'drug',
    then: Joi.string().trim().required(),
    otherwise: Joi.forbidden(),
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
};

export const newClaimSchema = Joi.object({
  referalCode: Joi.string().regex(VALID_REF_CODE),
  claims: Joi.array().items(Joi.object(newClaimReqBody)),
});

const claimUpdateReqBody = {
  category: Joi.string()
    .trim()
    .lowercase()
    .valid(...SERVICE_CATEGORIES)
    .required(),
  serviceName: Joi.when('category', {
    is: 'drug',
    then: Joi.forbidden(),
    otherwise: Joi.string().trim(),
  }),
  drugName: Joi.when('category', {
    is: 'drug',
    then: Joi.string().trim(),
    otherwise: Joi.forbidden(),
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
  unit: Joi.number().integer().min(1),
  pricePerUnit: Joi.number().min(0),
};
export const schemaClaimUpdateByIdParam = Joi.object(claimUpdateReqBody);

export const schemaBulkClaimProcessing = Joi.object({
  referalCode: Joi.string().regex(VALID_REF_CODE),
  remove: Joi.array().items(uuidSchema).unique(),
  update: Joi.array()
    .items(
      Joi.object({
        id: uuidSchema.required(), // id is the claim id
        ...claimUpdateReqBody,
      })
    )
    .unique((a, b) => a.id === b.id),
  create: Joi.array().items(newClaimReqBody),
});
