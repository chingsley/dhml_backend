import Response from '../../../src/utils/Response';
import { validateSchema } from '../../../src/validators/joi/config';
import { getRefCodeSchema } from '../../../src/validators/joi/schemas/refcode.schema';

export default class HcpMiddleware {
  static async validateNewRefcode(req, res, next) {
    try {
      const hcpSchema = getRefCodeSchema({ withRequiredFields: true });
      const { joiFormatted } = await validateSchema(hcpSchema, req.body);
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateNewRefcode', error, req, res, next);
    }
  }
}
