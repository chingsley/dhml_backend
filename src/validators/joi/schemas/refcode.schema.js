import { Joi, stringValidate, validateIntegerId } from '../config';

export const getRefCodeSchema = ({ withRequiredFields = true }) => {
  return Joi.object({
    enrolleeId: validateIntegerId(withRequiredFields),
    destinationHcpId: validateIntegerId(withRequiredFields),
    reasonForReferral: stringValidate(withRequiredFields),
    diagnosis: stringValidate(withRequiredFields),
    diagnosisStatus: Joi.string().trim().valid('provisional', 'final'),
    clinicalFindings: stringValidate(withRequiredFields),
    specialistService: stringValidate(withRequiredFields),
  });
};
