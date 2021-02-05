const {
  SUPERADMIN,
  ADMIN,
  DEPT_USER,
  VERIFIER,
  ENROLMENT_OFFICER,
  HCP,
  HOD_MEDICAL,
  HOD_VHS,
  HOD_ADMIN,
  HOD_STORES,
  HOD_ACCOUNT,
} = require('../constants/roles.constants');

const sampleRoles = [
  SUPERADMIN,
  ADMIN,
  DEPT_USER,
  VERIFIER,
  ENROLMENT_OFFICER,
  HCP,
  HOD_MEDICAL,
  HOD_VHS,
  HOD_ADMIN,
  HOD_STORES,
  HOD_ACCOUNT,
].map((title) => ({ title }));

module.exports = sampleRoles;
