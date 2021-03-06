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
  flagReason: Joi.string().trim().lowercase(),
  refcodeId: Joi.number().integer().min(1).required(),
});

export const schemaRefcodeIdArr = Joi.object({
  refcodeIds: Joi.array()
    .items(Joi.number().integer().min(1))
    .min(1)
    .unique()
    .required(),
});

export const refcodeQuerySchema = Joi.object({
  id: Joi.number().integer().min(1),
  page: Joi.number().integer().min(0),
  pageSize: Joi.number().integer().min(1),
  searchField: Joi.string().trim(),
  searchValue: Joi.when('searchField', {
    is: 'code',
    then: Joi.string()
      .regex(VALID_REF_CODE)
      .error(
        new Error('Invalid referal code. Please check the code and try again')
      ),
    otherwise: Joi.string().trim(),
  }),
  searchItem: Joi.string().trim(),
  isFlagged: Joi.bool().valid(true, false),
});
