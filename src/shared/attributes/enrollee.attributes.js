const personalData = [
  'id',
  'enrolmentType',
  'principalId',
  'scheme',
  'relationshipToPrincipal',
  'surname',
  'firstName',
  'middleName',
  'rank',
  'serviceNumber',
  'staffNumber',
  'title',
  'designation',
  'armOfService',
  'department',
  'employer',
  'dateOfBirth',
  'gender',
  'maritalStatus',
  'identificationType',
  'identificationNumber',
  'serviceStatus',
];
const contactDetails = [
  'phoneNumber',
  'email',
  'residentialAddress',
  'stateOfResidence',
  'lga',
];
const healthcareData = ['bloodGroup', 'significantMedicalHistory', 'hcpId'];
const uploads = [
  'photograph',
  'birthCertificate',
  'marriageCertificate',
  'idCard',
  'deathCertificate',
  'letterOfNok',
];

export default { personalData, contactDetails, healthcareData, uploads };

export const enrolleeFilterables = [
  'enrolmentType',
  'principalId',
  'scheme',
  'relationshipToPrincipal',
  'surname',
  'firstName',
  'middleName',
  'rank',
  'serviceNumber',
  'staffNumber',
  'title',
  'designation',
  'armOfService',
  'department',
  'employer',
  'dateOfBirth',
  'gender',
  'maritalStatus',
  'identificationType',
  'identificationNumber',
  'serviceStatus',
  ...contactDetails,
];

export const enrolleeSearchableFields = [
  { name: 'surname', type: 'string' },
  { name: 'firstName', type: 'string' },
  { name: 'middleName', type: 'string' },
  { name: 'email', type: 'string' },
  { name: 'scheme', type: 'string' },
  { name: 'staffNumber', type: 'string' },
  { name: 'serviceNumber', type: 'string' },
  { name: 'rank', type: 'string' },
  { name: 'principalId', type: 'number' },
  { name: 'armOfService', type: 'string' },
  { name: 'stateOfResidence', type: 'string' },
  { name: 'serviceStatus', type: 'string' },
  { name: 'hcpId', type: 'number' },
  { name: 'isVerified', type: 'boolean' },
  { name: 'enrolmentType', type: 'custom' },
  { name: 'gender', type: 'string' },
];
