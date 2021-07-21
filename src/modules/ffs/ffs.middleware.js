// import Joi from '@hapi/joi';
import { AUDIT_STATUS } from '../../shared/constants/lists.constants';
import { throwError } from '../../shared/helpers';
import Response from '../../utils/Response';
import { Joi, validateSchema } from '../../validators/joi/config';

export default class FFSMiddleware {
  static async validateQuery(req, res, next) {
    try {
      const querySchema = Joi.object({
        id: Joi.number().integer().min(1),
        page: Joi.number().integer().min(0),
        pageSize: Joi.number().integer().min(1),
        hcpCode: Joi.string().trim(),
        hcpName: Joi.string().trim(),
        category: Joi.string().trim(),
        selectedForPayment: Joi.string().trim().valid('true', 'false'),
        date: Joi.date()
          .format('YYYY-MM-DD')
          .max('now')
          .error(
            new Error(
              'date filter must have the format YYYY-MM-DD and cannot be in the future'
            )
          ),
      });
      const { joiFormatted } = await validateSchema(querySchema, req.query);
      const { hcpCode, hcpName } = req.query;
      FFSMiddleware.rejectSpecialCharacters([hcpCode, hcpName]);
      req.query = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateQuery', error, req, res, next);
    }
  }
  static async validateAuditRequest(req, res, next) {
    try {
      const bodySchema = Joi.object({
        selectedHcpIds: Joi.array()
          .items(Joi.number().integer().min(1))
          .unique()
          .required(),
      });
      const { joiFormatted } = await validateSchema(bodySchema, req.body);
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateAuditRequest', error, req, res, next);
    }
  }
  static async validateFFSAudit(req, res, next) {
    try {
      // remove 'pending' from allowed input audit status
      const ALLOWED_STATUS = { ...AUDIT_STATUS };
      delete ALLOWED_STATUS.pending;

      const auditSchema = Joi.object({
        auditStatus: Joi.string()
          .trim()
          .valid(...Object.values(ALLOWED_STATUS))
          .required(),
        flagReason: Joi.when('auditStatus', {
          is: AUDIT_STATUS.flagged,
          then: Joi.string().trim().required(),
          otherwise: Joi.forbidden(),
        }),
      });
      const { joiFormatted } = await validateSchema(auditSchema, req.body);
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateFFSAudit', error, req, res, next);
    }
  }

  static async validateFFSApproval(req, res, next) {
    try {
      const approvalSchema = Joi.object({
        approve: Joi.bool().required(),
      });
      const { joiFormatted } = await validateSchema(approvalSchema, req.body);
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateFFSApproval', error, req, res, next);
    }
  }

  static rejectSpecialCharacters(fields) {
    for (let field of fields) {
      const reg = /[`!#$%^&*()+=[\]{};':"<>?~]/;
      const match = field && field.match(reg);
      if (match) {
        throwError({
          status: 400,
          error: [
            `invalid search parameter. Character "${match[0]}" is not allowed `,
          ],
        });
      }
    }
  }
}
