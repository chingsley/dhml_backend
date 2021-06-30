import Response from '../../utils/Response';
import { validateSchema } from '../../validators/joi/config';
import { newClaimSchema } from '../../validators/joi/schemas/claims.schema';
import {} from '../../validators/joi/schemas/refcode.schema';

export default class ClaimsMiddleware {
  static async validateNewClaim(req, res, next) {
    try {
      const { joiFormatted } = await validateSchema(newClaimSchema, req.body);
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateNewClaim', error, req, res, next);
    }
  }
}
