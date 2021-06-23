import { Joi } from '../config';
import helpers from './helpers.schemas';

const newEnrolleeFields = (enrolmentType) => ({
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

const sharedSchema = { newEnrolleeFields };
export default sharedSchema;
