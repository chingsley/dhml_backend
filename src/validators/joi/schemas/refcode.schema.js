import {
  specialistCodes,
  stateCodes,
} from '../../../shared/constants/statecodes.constants';
import { Joi, stringValidate, validateIntegerId } from '../config';

export const validSpecialists = Object.keys(specialistCodes);
export const validStates = Object.keys(stateCodes);
export const VALID_REF_CODE = /^[A-Z]{2}\/\d{6}\/022\/(\d)+[A-Z]-[1-9][0-9]*\/(S|R|AD)$/;

export const getRefCodeSchema = ({ withRequiredFields = true }) => {
  return Joi.object({
    enrolleeId: validateIntegerId(withRequiredFields),
    destinationHcpId: validateIntegerId(withRequiredFields),
    reasonForReferral: stringValidate(withRequiredFields),
    diagnosis: stringValidate(withRequiredFields),
    diagnosisStatus: Joi.string()
      .trim()
      .valid('provisional', 'final')
      .required(),
    clinicalFindings: stringValidate(withRequiredFields),
    specialist: Joi.string()
      .trim()
      .lowercase()
      .valid(...validSpecialists)
      .required(),
    stateOfGeneration: Joi.string()
      .trim()
      .lowercase()
      .valid(...validStates)
      .required(),
  });
};

export const codeVerificationSchema = Joi.object({
  referalCode: Joi.string().regex(VALID_REF_CODE).required(),
});

export const flagUpdateSchema = Joi.object({
  flag: Joi.bool().valid(true, false).required(),
  refcodeId: Joi.number().integer().min(1).required(),
});
