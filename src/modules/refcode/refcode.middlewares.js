import Response from '../../../src/utils/Response';
import { validateSchema } from '../../../src/validators/joi/config';
import {
  getRefCodeSchema,
  codeVerificationSchema,
  flagUpdateSchema,
  schemaRefcodeIdArr,
  refcodeQuerySchema,
  schemaEnrolleeIdNo,
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

  static async validateRefcode(req, res, next) {
    try {
      const { joiFormatted } = await validateSchema(
        codeVerificationSchema,
        req.query
      );
      req.query = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateRefcode', error, req, res, next);
    }
  }
  static async validateFlagStatus(req, res, next) {
    try {
      const { joiFormatted } = await validateSchema(flagUpdateSchema, {
        ...req.body,
        ...req.params,
      });
      req.query = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateFlagStatus', error, req, res, next);
    }
  }
  static async validateRefcodeIdArr(req, res, next) {
    try {
      const { joiFormatted } = await validateSchema(
        schemaRefcodeIdArr,
        req.body
      );
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateRefcodeIdArr', error, req, res, next);
    }
  }
  static async validateRefcodeQuery(req, res, next) {
    try {
      const { joiFormatted } = await validateSchema(
        refcodeQuerySchema,
        req.query
      );
      req.query = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateRefcodeQuery', error, req, res, next);
    }
  }
  static async validateFetchCodeHistory(req, res, next) {
    try {
      const { joiFormatted } = await validateSchema(
        schemaEnrolleeIdNo,
        req.query
      );
      req.query = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateFetchCodeHistory', error, req, res, next);
    }
  }
}
