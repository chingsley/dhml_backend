import Response from '../../utils/Response';
import { validateSchema } from '../../validators/joi/config';
import {
  newEnrolleeSchema,
  groupEnrolleeDetails,
} from '../../validators/joi/schemas/enrollee.schema';

// import { SCHEMES } from '../shared/config';

export default class EnrolleeMiddleware {
  static async validateNewEnrollee(req, res, next) {
    try {
      const {
        personalDataSchema,
        contactDetailsSchema,
        healthCareDataSchema,
        uploadsSchema,
      } = newEnrolleeSchema;
      const result = groupEnrolleeDetails({ ...req.body });
      // console.log(req.body);
      const { personalData, contactDetails, healthcareData, uploads } = result;
      await validateSchema(personalDataSchema, personalData, 'Personal Data: ');
      await validateSchema(
        contactDetailsSchema,
        contactDetails,
        'Contact Details: '
      );
      // console.log(healthcareData);
      await validateSchema(
        healthCareDataSchema,
        healthcareData,
        'Healthcare data: '
      );
      await validateSchema(uploadsSchema, uploads, 'Uploads: ');
      // return res.send('testing...');
      // // EnrolleeMiddleware.validateDependantScheme('VCSHIP', 'DSSHIP');
      return next();
    } catch (error) {
      Response.handleError('validateNewEnrollee', error, req, res, next);
    }
  }

  static validateDependantScheme(dependantScheme, principalScheme) {
    const invalidDependantScheme =
      (principalScheme === 'AFRSHIP' &&
        !['AFRSHIP', 'VCSHIP'].includes(dependantScheme)) ||
      (principalScheme === 'DSSHIP' &&
        !['DSSHIP', 'VCSHIP'].includes(dependantScheme));

    if (invalidDependantScheme) {
      throw new Error(
        JSON.stringify({
          status: 400,
          error: [
            `a principal under ${principalScheme} cannot have a dependant under ${dependantScheme}`,
          ],
        })
      );
    }
  }
}
