import { specialistCodes } from '../../../shared/constants/statecodes.constants';
import { Joi } from '../config';
import helpers from './helpers.schemas';
import SharedFields from '../sharedFields';

const sharedFields = new SharedFields({ Joi, helpers });

export const validSpecialists = Object.keys(specialistCodes);

const encounterSchema = {
  provisionalDiagnosis1: Joi.string().trim().required(),
  provisionalDiagnosis2: Joi.string().trim(),
  provisionalDiagnosis3: Joi.string().trim(),
  provisionalDiagnosis4: Joi.string().trim(),
  treatmentCost1: Joi.number().required(),
  treatmentCost2: Joi.number(),
  treatmentCost3: Joi.number(),
  treatmentCost4: Joi.number(),
  prescription: Joi.string().trim(),
  isReferalVisit: Joi.bool().required(),
};

export const schemaFristTimeEncounter = (enrolmentType) => {
  return Joi.object({
    ...sharedFields.newEnrolleeFields(enrolmentType),
    bloodGroup: Joi.string().trim(),
    ...encounterSchema,
  });
};

export const schemaReturningEncounter = Joi.object({
  enrolleeIdNo: Joi.string().trim().required(),
  ...encounterSchema,
}).unknown();
