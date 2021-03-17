import { Joi } from '../config';
import helpers from './helpers.schemas';

export const newEnrolleeSchema = (enrolmentType = '') =>
  Joi.object({
    scheme: Joi.string()
      .trim()
      .uppercase()
      .required()
      .valid('AFRSHIP', 'VCSHIP', 'DSSHIP'),
    enrolmentType: Joi.when('scheme', {
      is: 'VCSHIP',
      then: Joi.string().trim().valid('dependant').required(),
      otherwise: Joi.string()
        .trim()
        .valid('principal', 'special-principal', 'dependant')
        .required(),
    }),
    enrolleeIdNo: Joi.when('enrolmentType', {
      is: 'special-principal',
      then: Joi.string().trim().required(),
      otherwise: Joi.forbidden(),
    }),
    principalId: Joi.string().trim().when('enrolmentType', {
      is: 'dependant',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    relationshipToPrincipal: Joi.string().trim().when('enrolmentType', {
      is: 'dependant',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    dependantType: Joi.string().trim(),
    serviceNumber: helpers.svnValidation(enrolmentType),
    armOfService: helpers.aosValidation(enrolmentType),
    rank: helpers.rankValidation(enrolmentType),
    serviceStatus: helpers.svsValidation(enrolmentType),
    staffNumber: helpers.stffNumValidation(enrolmentType),
    surname: Joi.string().trim().required(),
    firstName: Joi.string().trim().required(),
    middleName: Joi.string().trim(),
    title: Joi.string().trim(),
    designation: Joi.string().trim(),
    department: Joi.string().trim(),
    employer: Joi.string().trim(),
    dateOfBirth: Joi.date().format('YYYY-MM-DD').max('now'),
    gender: Joi.string().trim().valid('male', 'female'),
    maritalStatus: Joi.string()
      .trim()
      .valid('single', 'married', 'widow', 'widower'),
    identificationType: Joi.string().trim(),
    identificationNumber: Joi.string().trim(),
    bloodGroup: Joi.string().trim().required(),
    significantMedicalHistory: Joi.string().trim(),
    hcpId: Joi.number().when('enrolmentType', {
      is: 'dependant',
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
    phoneNumber: Joi.string().trim().required(),
    email: Joi.string().trim().required(),
    residentialAddress: Joi.string().trim().required(),
    stateOfResidence: Joi.string().trim().required(),
    lga: Joi.string().trim().required(),
    photograph: Joi.any(),
    birthCertificate: Joi.any(),
    marriageCertificate: Joi.any(),
    idCard: Joi.any(),
    deathCertificate: Joi.any(),
    letterOfNok: Joi.any(),
  });

export const patchEnrolleeSchema = Joi.object({
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
  maritalStatus: Joi.string()
    .trim()
    .valid('single', 'married', 'widow', 'widower'),
  identificationType: Joi.string().trim(),
  identificationNumber: Joi.string().trim(),
  serviceStatus: Joi.string().trim().valid('serving', 'retired'),
  relationshipToPrincipal: Joi.string().trim(),
  phoneNumber: Joi.string().trim(),
  email: Joi.string().trim(),
  residentialAddress: Joi.string().trim(),
  stateOfResidence: Joi.string().trim(),
  lga: Joi.string().trim(),
  bloodGroup: Joi.string().trim(),
  significantMedicalHistory: Joi.string().trim(),
  hcpId: Joi.number(),
  photograph: Joi.any(),
  birthCertificate: Joi.any(),
  marriageCertificate: Joi.any(),
  idCard: Joi.any(),
  deathCertificate: Joi.any(),
  letterOfNok: Joi.any(),
  dependants: Joi.array().items(Joi.object()),
});

export const enrolleeQuerySchema = Joi.object({
  id: Joi.number().integer().min(1),
  page: Joi.number().integer().min(0),
  pageSize: Joi.number().integer().min(1),
  searchField: Joi.string().trim(),
  searchValue: Joi.string().trim(),
  searchItem: Joi.string().trim(),
  isVerified: Joi.string().trim().valid('true', 'false'),
});
