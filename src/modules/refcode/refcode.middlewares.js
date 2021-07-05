import Response from '../../utils/Response';
import { validateSchema } from '../../validators/joi/config';
import {
  querySchemaGetOneRefcode,
  codeStatusUpdateSchema,
  schemaRefcodeIdArr,
  refcodeQuerySchema,
  schemaEnrolleeIdNo,
  schemaCodeRequestForNewEnrollee,
  schemaCodeRequestForExistingEnrollee,
  shcemaPatchCodeRequest,
  claimsVerificationSchema,
  claimsDocUploadSchema,
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

  static async validateGetOneRefcode(req, res, next) {
    try {
      const { joiFormatted } = await validateSchema(
        querySchemaGetOneRefcode,
        req.query
      );
      req.query = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateGetOneRefcode', error, req, res, next);
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
  static async validateClaimsVerification(req, res, next) {
    try {
      const { joiFormatted } = await validateSchema(
        claimsVerificationSchema,
        req.body
      );
      req.query = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateClaimsVerification', error, req, res, next);
    }
  }
  static async validateClaimsDocUpload(req, res, next) {
    try {
      await validateSchema(claimsDocUploadSchema, req.files);
      return next();
    } catch (error) {
      Response.handleError('validateClaimsDocUpload', error, req, res, next);
    }
  }
}
