class SharedFields {
  constructor({ Joi, helpers }) {
    this.Joi = Joi;
    this.helpers = helpers;
  }

  newEnrolleeFields(enrolmentType = '') {
    return {
      scheme: this.Joi.string()
        .trim()
        .uppercase()
        .required()
        .valid('AFRSHIP', 'VCSHIP', 'DSSHIP'),
      enrolmentType: this.Joi.when('scheme', {
        is: 'VCSHIP',
        then: this.Joi.string().trim().valid('dependant').required(),
        otherwise: this.Joi.string()
          .trim()
          .valid('principal', 'special-principal', 'dependant')
          .required(),
      }),
      enrolleeIdNo: this.Joi.when('enrolmentType', {
        is: 'special-principal',
        then: this.Joi.string().trim().required(),
        otherwise: this.Joi.forbidden(),
      }),
      principalId: this.Joi.string().trim().when('enrolmentType', {
        is: 'dependant',
        then: this.Joi.required(),
        otherwise: this.Joi.forbidden(),
      }),
      relationshipToPrincipal: this.Joi.string().trim().when('enrolmentType', {
        is: 'dependant',
        then: this.Joi.required(),
        otherwise: this.Joi.forbidden(),
      }),
      dependantType: this.Joi.string().trim(),
      serviceNumber: this.helpers.svnValidation(enrolmentType),
      armOfService: this.helpers.aosValidation(enrolmentType),
      rank: this.helpers.rankValidation(enrolmentType),
      serviceStatus: this.helpers.svsValidation(enrolmentType),
      staffNumber: this.helpers.stffNumValidation(enrolmentType),
      surname: this.Joi.string().trim().required(),
      firstName: this.Joi.string().trim().required(),
      middleName: this.Joi.string().trim(),
      title: this.Joi.string().trim(),
      designation: this.Joi.string().trim(),
      department: this.Joi.string().trim(),
      employer: this.Joi.string().trim(),
      dateOfBirth: this.Joi.date().format('YYYY-MM-DD').max('now'),
      gender: this.Joi.string().trim().valid('male', 'female'),
      maritalStatus: this.Joi.string()
        .trim()
        .valid('single', 'married', 'widow', 'widower'),
      identificationType: this.Joi.string().trim(),
      identificationNumber: this.Joi.string().trim(),
      bloodGroup: this.Joi.string().trim().required(),
      significantMedicalHistory: this.Joi.string().trim(),
      hcpId: this.Joi.number().when('enrolmentType', {
        is: 'dependant',
        then: this.Joi.optional(),
        otherwise: this.Joi.required(),
      }),
      phoneNumber: this.Joi.string().trim().required(),
      email: this.Joi.string().trim().required(),
      residentialAddress: this.Joi.string().trim().required(),
      stateOfResidence: this.Joi.string().trim().required(),
      lga: this.Joi.string().trim().required(),
      photograph: this.Joi.any(),
      birthCertificate: this.Joi.any(),
      marriageCertificate: this.Joi.any(),
      idCard: this.Joi.any(),
      deathCertificate: this.Joi.any(),
      letterOfNok: this.Joi.any(),
      nin: this.Joi.string().trim(),
    };
  }

  refcodeRequestFields(validStates) {
    return {
      referringHcpId: this.Joi.number().min(1).required(),
      receivingHcpId: this.Joi.number().min(1).required(),
      reasonForReferral: this.Joi.string().trim().required(),
      diagnosis: this.Joi.string().trim().required(),
      clinicalFindings: this.Joi.string().trim().required(),
      specialtyId: this.Joi.string()
        .guid({
          version: ['uuidv4', 'uuidv5'],
        })
        .required(),
      stateOfGeneration: this.Joi.string()
        .trim()
        .lowercase()
        .valid(...validStates),
    };
  }
}

export default SharedFields;
