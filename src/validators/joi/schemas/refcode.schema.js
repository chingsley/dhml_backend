import {
  specialistCodes,
  stateCodes,
} from '../../../shared/constants/statecodes.constants';
import { Joi } from '../config';
import { CODE_STATUS } from '../../../shared/constants/lists.constants';

export const validSpecialists = Object.keys(specialistCodes);
const validStates = Object.keys(stateCodes);

export const VALID_REF_CODE =
  /^[A-Z]{2,3}\/\d{6}\/022\/(\d)+[A-Z]-[1-9][0-9]*\/(S|R|AD)$/;

export const codeRequestSchema = Joi.object({
  enrolleeIdNo: Joi.string().trim().required(),
  referringHcpId: Joi.number().min(1).required(),
  receivingHcpId: Joi.number().min(1).required(),
  reasonForReferral: Joi.string().trim().required(),
  diagnosis: Joi.string().trim().required(),
  clinicalFindings: Joi.string().trim().required(),
  specialtyId: Joi.string()
    .guid({
      version: ['uuidv4', 'uuidv5'],
    })
    .required(),
  stateOfGeneration: Joi.string()
    .trim()
    .lowercase()
    .valid(...validStates),
});

export const shcemaPatchCodeRequest = Joi.object({
  receivingHcpId: Joi.number().min(1),
  reasonForReferral: Joi.string().trim(),
  diagnosis: Joi.string().trim(),
  clinicalFindings: Joi.string().trim(),
  specialtyId: Joi.string().guid({
    version: ['uuidv4', 'uuidv5'],
  }),
});

export const querySchemaGetOneRefcode = Joi.object({
  referalCode: Joi.string().regex(VALID_REF_CODE),
  refcodeId: Joi.string().guid({
    version: ['uuidv4', 'uuidv5'],
  }),
}).or('referalCode', 'refcodeId');

export const codeStatusUpdateSchema = Joi.object({
  status: Joi.string()
    .trim()
    .uppercase()
    .valid(...Object.values(CODE_STATUS))
    .required(),
  declineReason: Joi.when('status', {
    is: CODE_STATUS.DECLINED,
    then: Joi.string().trim().required(),
    otherwise: Joi.forbidden(),
  }),
  flagReason: Joi.when('status', {
    is: CODE_STATUS.FLAGGED,
    then: Joi.string().trim().required(),
    otherwise: Joi.forbidden(),
  }),
  stateOfGeneration: Joi.when('status', {
    is: CODE_STATUS.APPROVED,
    then: Joi.string()
      .trim()
      .lowercase()
      .valid(...validStates)
      .required(),
    otherwise: Joi.forbidden(),
  }),
  claimsDeclineReason: Joi.when('status', {
    is: CODE_STATUS.CLAIMS_DECLINED,
    then: Joi.string().trim().required(),
    otherwise: Joi.forbidden(),
  }),
}).unknown();

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

export const claimsVerificationSchema = Joi.object({
  remarks: Joi.string().trim().required(),
});

export const claimsDocUploadSchema = Joi.object({
  image: Joi.any().required(),
});
