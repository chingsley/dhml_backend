import { Joi } from '../config';

export const staffQuerySchema = Joi.object({
  unregisteredOnly: Joi.string().trim().valid('true', 'false'),
  pageSize: Joi.number().integer().min(1),
  page: Joi.number().integer().min(0),
  staffFileNo: Joi.string().trim(),
  staffIdNo: Joi.string().trim(),
  surname: Joi.string().trim(),
  firstName: Joi.string().trim(),
  middleName: Joi.string().trim(),
  stateOfOrigin: Joi.string().trim(),
  phoneNumber: Joi.string().trim(),
  designation: Joi.string().trim(),
  deployment: Joi.string().trim(),
  location: Joi.string().trim(),
  pfa: Joi.string().trim(),
});

function stringValidate(withRequiredFields) {
  return withRequiredFields
    ? Joi.string().trim().required()
    : Joi.string().trim();
}

export const getStaffSchema = ({ withRequiredFields = true }) => {
  return Joi.object({
    staffFileNo: Joi.string().trim(),
    staffIdNo: stringValidate(withRequiredFields),
    surname: stringValidate(withRequiredFields),
    firstName: stringValidate(withRequiredFields),
    email: stringValidate(withRequiredFields),
    middleName: Joi.string().trim(),
    gender: stringValidate(withRequiredFields),
    permanentHomeAddress: Joi.string().trim(),
    contactAddress: stringValidate(withRequiredFields),
    dateOfBirth: Joi.date(),
    placeOfBirth: stringValidate(withRequiredFields),
    homeTown: stringValidate(withRequiredFields),
    lga: stringValidate(withRequiredFields),
    stateOfOrigin: stringValidate(withRequiredFields),
    maritalStatus: stringValidate(withRequiredFields),
    numberOfChildren: Joi.number().default(0),
    phoneNumber: stringValidate(withRequiredFields),
    firstAppointment: Joi.string().trim(),
    dateOfFirstAppointment: Joi.string().trim(),
    gradeLevelOnFirstAppointment: Joi.string().trim(),
    presentAppointment: Joi.string().trim(),
    dateOfPresentAppointment: Joi.string().trim(),
    presentGradeLevel: Joi.string().trim(),
    designation: Joi.string().trim(),
    departmentOrUnit: Joi.string().trim(),
    deployment: Joi.string().trim(),
    location: Joi.string().trim(),
    jobSchedule: Joi.string().trim(),
    dateOfConfirmation: Joi.string().trim(),
    salaryPerAnnum: Joi.number(),
    bank: Joi.string().trim(),
    branch: Joi.string().trim(),
    pfa: Joi.string().trim(),
    dateOfJoiningDhmlCooperativeSociety: Joi.string().trim(),
    primarySchoolAttended: stringValidate(withRequiredFields),
    secondarySchoolAttended: Joi.string().trim(),
    tertiaryIntitutionAttended: Joi.string().trim(),
    qualifications: Joi.string().trim(),
    nameOfPreviousEmployer: Joi.string().trim(),
    positionHeld: Joi.string().trim(),
    jobScheduleAtPreviousEmployment: Joi.string().trim(),
    reasonForDisengagement: Joi.string().trim(),
    dateOfDisengagement: Joi.string().trim(),
    hodRemarks: Joi.string().trim(),
    mdComment: Joi.string().trim(),
    nextOfKin: stringValidate(withRequiredFields),
    relationshipWithNok: stringValidate(withRequiredFields),
    addressOfNok: stringValidate(withRequiredFields),
    phoneNumberOfNok: stringValidate(withRequiredFields),
  });
};
