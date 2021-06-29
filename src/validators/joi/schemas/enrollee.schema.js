import { Joi } from '../config';
import helpers from './helpers.schemas';
import SharedFields from '../sharedFields';

const sharedFields = new SharedFields({ Joi, helpers });

export const newEnrolleeSchema = (enrolmentType = '') =>
  Joi.object(sharedFields.newEnrolleeFields(enrolmentType));

export const patchEnrolleeSchema = Joi.object({
  principalId: Joi.string().trim(),
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
  nin: Joi.string().trim(),
});

export const enrolleeQuerySchema = Joi.object({
  id: Joi.number().integer().min(1),
  page: Joi.number().integer().min(0),
  pageSize: Joi.number().integer().min(1),
  searchField: Joi.string().trim(),
  searchValue: Joi.string().trim(),
  searchItem: Joi.string().trim(),
  isVerified: Joi.string().trim().valid('true', 'false'),
  serviceNumber: Joi.string().trim(),
  enrolleeIdNo: Joi.string().trim(),
  referalCode: Joi.string().trim(),
});
