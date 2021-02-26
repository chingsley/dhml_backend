import Response from '../../../src/utils/Response';
import { validateSchema } from '../../../src/validators/joi/config';
import {
  getRefCodeSchema,
  codeVerificationSchema,
} from '../../../src/validators/joi/schemas/refcode.schema';

export default class RefcodeMiddleware {
  static async validateNewRefcode(req, res, next) {
    try {
      const referalCodeSchema = getRefCodeSchema({ withRequiredFields: true });
      const { joiFormatted } = await validateSchema(
        referalCodeSchema,
        req.body
      );
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateNewRefcode', error, req, res, next);
    }
  }

  static async validateQuery(req, res, next) {
    try {
      const { joiFormatted } = await validateSchema(
        codeVerificationSchema,
        req.query
      );
      req.query = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateQuery', error, req, res, next);
    }
  }
}
