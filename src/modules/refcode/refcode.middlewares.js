import Response from '../../utils/Response';
import { validateSchema } from '../../validators/joi/config';
import {
  codeVerificationSchema,
  codeStatusUpdateSchema,
  schemaRefcodeIdArr,
  refcodeQuerySchema,
  schemaEnrolleeIdNo,
  schemaCodeRequestForNewEnrollee,
  schemaCodeRequestForExistingEnrollee,
  shcemaPatchCodeRequest,
} from '../../validators/joi/schemas/refcode.schema';

export default class RefcodeMiddleware {
  static async validateRequestForRefcode(req, res, next) {
    try {
      const { enrolleeIdNo, enrolmentType } = req.body;
      const refcodeSchema = enrolleeIdNo
        ? schemaCodeRequestForExistingEnrollee
        : schemaCodeRequestForNewEnrollee(enrolmentType);
      const { joiFormatted } = await validateSchema(refcodeSchema, req.body);
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateRequestForRefcode', error, req, res, next);
    }
  }
  static async validateCodeDetailsUpdate(req, res, next) {
    try {
      const { joiFormatted } = await validateSchema(
        shcemaPatchCodeRequest,
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
  static async validateCodeStatusUpdate(req, res, next) {
    try {
      const { joiFormatted } = await validateSchema(
        codeStatusUpdateSchema,
        req.body
      );
      req.body = joiFormatted;
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
