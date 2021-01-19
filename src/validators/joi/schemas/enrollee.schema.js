import enrolleeAttributes from '../../../shared/attributes/enrollee.attributes';
import { Joi } from '../config';

export const newEnrolleeSchema = {
  personalDataSchema: Joi.object({
    enrolmentType: Joi.string()
      .trim()
      .valid('principal', 'special-principal', 'dependant')
      .required(),
    id: Joi.string().when('enrolmentType', {
      is: 'special-principal',
      then: Joi.string().trim().required(),
      otherwise: Joi.forbidden(),
    }),
    principalId: Joi.string().when('enrolmentType', {
      is: 'dependant',
      then: Joi.string().trim().required(),
      otherwise: Joi.forbidden(),
    }),
    relationshipToPrincipal: Joi.string().trim().when('enrolmentType', {
      is: 'principal',
      then: Joi.forbidden(),
      otherwise: Joi.string().trim(),
    }),
    dependantType: Joi.string().trim(),
    scheme: Joi.string().trim().required().valid('AFRSHIP', 'VCSHIP', 'DSSHIP'),
    surname: Joi.string().trim().required(),
    firstName: Joi.string().trim().required(),
    middleName: Joi.string().trim(),
    rank: Joi.string().trim(),
    serviceNumber: Joi.string().trim(),
    staffNumber: Joi.string().trim(),
    title: Joi.string().trim(),
    designation: Joi.string().trim(),
    armOfService: Joi.string().trim(),
    department: Joi.string().trim(),
    employer: Joi.string().trim(),
    dateOfBirth: Joi.date().format('YYYY-MM-DD').max('now'),
    gender: Joi.string().trim().valid('male', 'female'),
    maritalStatus: Joi.string().trim().valid('single', 'married'),
    identificationType: Joi.string().trim(),
    identificationNumber: Joi.string().trim(),
    serviceStatus: Joi.string().trim().valid('serving', 'retired'),
  }),
  contactDetailsSchema: Joi.object({
    phoneNumber: Joi.string().trim().required(),
    email: Joi.string().trim().required(),
    residentialAddress: Joi.string().trim().required(),
    stateOfResidence: Joi.string().trim().required(),
    lga: Joi.string().trim().required(),
  }),
  healthCareDataSchema: Joi.object({
    bloodGroup: Joi.string().trim().required(),
    significantMedicalHistory: Joi.string().trim(),
    hcpId: Joi.number().required(),
  }),
  uploadsSchema: Joi.object({
    photograph: Joi.string().trim(),
    birthCertificate: Joi.string().trim(),
    marriageCertificate: Joi.string().trim(),
    idCard: Joi.string().trim(),
    deathCertificate: Joi.string().trim(),
    letterOfNok: Joi.string().trim(),
  }),
};

export const patchEnrolleeSchema = {
  personalDataSchema: Joi.object({
    surname: Joi.string().trim(),
    firstName: Joi.string().trim(),
    middleName: Joi.string().trim(),
    rank: Joi.string().trim(),
    serviceNumber: Joi.string().trim(),
    staffNumber: Joi.string().trim(),
    title: Joi.string().trim(),
    designation: Joi.string().trim(),
    armOfService: Joi.string().trim(),
    department: Joi.string().trim(),
    employer: Joi.string().trim(),
    dateOfBirth: Joi.date().format('YYYY-MM-DD').max('now'),
    gender: Joi.string().trim().valid('male', 'female'),
    maritalStatus: Joi.string().trim().valid('single', 'married'),
    identificationType: Joi.string().trim(),
    identificationNumber: Joi.string().trim(),
    serviceStatus: Joi.string().trim().valid('serving', 'retired'),
    relationshipToPrincipal: Joi.string().trim(),
  }),
  contactDetailsSchema: Joi.object({
    phoneNumber: Joi.string().trim(),
    email: Joi.string().trim(),
    residentialAddress: Joi.string().trim(),
    stateOfResidence: Joi.string().trim(),
    lga: Joi.string().trim(),
  }),
  healthCareDataSchema: Joi.object({
    bloodGroup: Joi.string().trim(),
    significantMedicalHistory: Joi.string().trim(),
    hcpId: Joi.number(),
  }),
  uploadsSchema: Joi.object({
    photograph: Joi.string().trim(),
    birthCertificate: Joi.string().trim(),
    marriageCertificate: Joi.string().trim(),
    idCard: Joi.string().trim(),
    deathCertificate: Joi.string().trim(),
    letterOfNok: Joi.string().trim(),
  }),
};

const attributes = enrolleeAttributes;

export const groupEnrolleeDetails = (enrollee) => {
  return Object.entries(enrollee).reduce(
    (objectToBeReturned, [key, value]) => {
      if (attributes.contactDetails.includes(key)) {
        objectToBeReturned.contactDetails[key] = value;
      } else if (attributes.healthcareData.includes(key)) {
        objectToBeReturned.healthcareData[key] = value;
      } else if (attributes.uploads.includes(key)) {
        objectToBeReturned.uploads[key] = value;
      } else {
        objectToBeReturned.personalData[key] = value;
      }
      return objectToBeReturned;
    },
    {
      personalData: {},
      contactDetails: {},
      healthcareData: {},
      uploads: {},
    }
  );
};
