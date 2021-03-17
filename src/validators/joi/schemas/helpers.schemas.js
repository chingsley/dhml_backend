import { RANKS } from '../../../shared/constants/ranks.constants';
import { Joi } from '../config';

export const svnValidation = (enrolmentTyps) => {
  if (enrolmentTyps.match(/principal/i)) {
    return Joi.when('scheme', {
      is: 'AFRSHIP',
      then: Joi.string().trim().uppercase().required(),
      otherwise: Joi.forbidden(),
    });
  } else {
    return Joi.forbidden();
  }
};
export const aosValidation = (enrolmentTyps) => {
  if (enrolmentTyps.match(/principal/i)) {
    return Joi.when('scheme', {
      is: 'AFRSHIP',
      then: Joi.string()
        .trim()
        .uppercase()
        .required()
        .valid('ARMY', 'NAVY', 'AIRFORCE'),
      otherwise: Joi.forbidden(),
    });
  } else {
    return Joi.forbidden();
  }
};
export const rankValidation = (enrolmentTyps) => {
  if (enrolmentTyps.match(/principal/i)) {
    return Joi.when('scheme', {
      is: 'AFRSHIP',
      then: Joi.string()
        .trim()
        .uppercase()
        .required()
        .valid(...RANKS),
      otherwise: Joi.forbidden(),
    });
  } else {
    return Joi.forbidden();
  }
};
export const svsValidation = (enrolmentTyps) => {
  if (enrolmentTyps.match(/principal/i)) {
    return Joi.when('scheme', {
      is: 'AFRSHIP',
      then: Joi.string().trim().required().valid('serving', 'retired'),
      otherwise: Joi.string().trim().valid('serving', 'retired'),
    });
  } else {
    return Joi.forbidden();
  }
};
export const stffNumValidation = (enrolmentTyps) => {
  if (enrolmentTyps.match(/principal/i)) {
    return Joi.when('scheme', {
      is: 'DSSHIP',
      then: Joi.string().trim().uppercase().required(),
      otherwise: Joi.forbidden(),
    });
  } else {
    return Joi.forbidden();
  }
};

export const enrolleeValidatorSchemas = {
  afshipPrincipal: Joi.object({
    armOfService: Joi.string().trim().uppercase().required(),
    rank: Joi.string().trim().uppercase().required(),
    serviceNumber: Joi.string().trim().uppercase().required(),
    staffNumber: Joi.valid(null).error(
      new Error('staffNumber is not required')
    ),
  }),
  dsshipPrincipal: Joi.object({
    armOfService: Joi.valid(null).error(
      new Error('armOfService is not allowed')
    ),
    rank: Joi.valid(null).error(new Error('rank is not allowed')),
    serviceNumber: Joi.valid(null).error(
      new Error('serviceNumber is not allowed')
    ),
    staffNumber: Joi.string().trim().uppercase().required(),
  }),
  dependant: Joi.object({
    armOfService: Joi.valid(null).error(
      new Error('armOfService is not allowed')
    ),
    rank: Joi.valid(null).error(new Error('rank is not allowed')),
    serviceNumber: Joi.valid(null).error(
      new Error('serviceNumber is not allowed')
    ),
    staffNumber: Joi.valid(null).error(new Error('staffNumber is not allowed')),
  }),
};

export default {
  svnValidation,
  aosValidation,
  rankValidation,
  svsValidation,
  stffNumValidation,
};
