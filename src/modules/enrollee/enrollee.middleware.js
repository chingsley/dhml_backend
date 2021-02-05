import Response from '../../utils/Response';
import { validateSchema } from '../../validators/joi/config';
import {
  newEnrolleeSchema,
  patchEnrolleeSchema,
} from '../../validators/joi/schemas/enrollee.schema';

export default class EnrolleeMiddleware {
  static async validateNewEnrollee(req, res, next) {
    try {
      const { joiFormatted } = await validateSchema(newEnrolleeSchema, {
        ...req.body,
        // ...req.files,
      });
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateNewEnrollee', error, req, res, next);
    }
  }
  static async validateEnrolleeUpdate(req, res, next) {
    try {
      await validateSchema(patchEnrolleeSchema, req.body, 'Cannot Update: ');
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
