import {
  specialistCodes,
  stateCodes,
} from '../../../shared/constants/statecodes.constants';
import { Joi, stringValidate, validateIntegerId } from '../config';
import helpers from './helpers.schemas';
import SharedFields from '../sharedFields';
import { CODE_STATUS } from '../../../shared/constants/lists.constants';

const sharedFields = new SharedFields({ Joi, helpers });

export const validSpecialists = Object.keys(specialistCodes);
export const validStates = Object.keys(stateCodes);
export const VALID_REF_CODE =
  /^[A-Z]{2,3}\/\d{6}\/022\/(\d)+([A-Z])*-[1-9][0-9]*\/(S|R|AD)$/;

export const getRefCodeSchema = ({ withRequiredFields = true }) => {
  return Joi.object({
    enrolleeId: validateIntegerId(withRequiredFields),
    receivingHcpId: validateIntegerId(withRequiredFields),
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

export const schemaCodeRequestForNewEnrollee = (enrolmentType) => {
  return Joi.object({
    ...sharedFields.newEnrolleeFields(enrolmentType),
    ...sharedFields.refcodeRequestFields(validStates),
    // receivingHcpId: Joi.number().min(1).required(),
    // reasonForReferral: Joi.string().trim().required(),
    // diagnosis: Joi.string().trim().required(),
    // diagnosisStatus: Joi.string()
    //   .trim()
    //   .valid('provisional', 'final')
    //   .required(),
    // clinicalFindings: Joi.string().trim().required(),
    // specialtyId: Joi.string()
    //   .guid({
    //     version: ['uuidv4', 'uuidv5'],
    //   })
    //   .required(),
    // stateOfGeneration: Joi.string()
    //   .trim()
    //   .lowercase()
    //   .valid(...validStates)
    //   .required(),
  });
};

export const schemaCodeRequestForExistingEnrollee = Joi.object({
  enrolleeIdNo: Joi.string().trim().required(),
  ...sharedFields.refcodeRequestFields(validStates),
  // receivingHcpId: Joi.number().min(1).required(),
  // reasonForReferral: Joi.string().trim().required(),
  // diagnosis: Joi.string().trim().required(),
  // diagnosisStatus: Joi.string().trim().valid('provisional', 'final').required(),
  // clinicalFindings: Joi.string().trim().required(),
  // specialtyId: Joi.string()
  //   .guid({
  //     version: ['uuidv4', 'uuidv5'],
  //   })
  //   .required(),
  // stateOfGeneration: Joi.string()
  //   .trim()
  //   .lowercase()
  //   .valid(...validStates)
  //   .required(),
}).unknown();

export const codeVerificationSchema = Joi.object({
  referalCode: Joi.string().regex(VALID_REF_CODE).required(),
});

export const codeStatusUpdateSchema = Joi.object({
  refcodeId: Joi.number().integer().min(1).required(), // in params
  status: Joi.string()
    .trim()
    .valid(...Object.values(CODE_STATUS))
    .required(),
  flagReason: Joi.when('status', {
    is: CODE_STATUS.FLAGGED,
    then: Joi.string().trim().required(),
    otherwise: Joi.forbidden(),
  }),
});

export const schemaRefcodeIdArr = Joi.object({
  refcodeIds: Joi.array()
    .items(Joi.number().integer().min(1))
    .min(1)
    .unique()
    .required(),
});

export const refcodeQuerySchema = Joi.object({
  page: Joi.number().integer().min(0),
  pageSize: Joi.number().integer().min(1),
  searchItem: Joi.string().trim(),
  isFlagged: Joi.bool().valid(true, false),
});

export const schemaEnrolleeIdNo = Joi.object({
  enrolleeIdNo: Joi.string().trim().required(),
  page: Joi.number().integer().min(0),
  pageSize: Joi.number().integer().min(1),
  searchField: Joi.string().trim(),
  searchValue: Joi.string().trim(),
});
