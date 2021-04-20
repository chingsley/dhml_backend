import { Joi, validateSchema } from '../../validators/joi/config';
import Response from '../../utils/Response';
import { AUDIT_STATUS } from '../../shared/constants/lists.constants';

export default class ReportsMiddleware {
  static async validateCapSumApproval(req, res, next) {
    try {
      const approvalSchema = Joi.object({
        approve: Joi.bool().required(),
      });
      const { joiFormatted } = await validateSchema(approvalSchema, req.body);
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateCapSumApproval', error, req, res, next);
    }
  }
  static async validateCapSumAudit(req, res, next) {
    try {
      const auditSchema = Joi.object({
        auditStatus: Joi.string()
          .trim()
          .valid(...Object.values(AUDIT_STATUS))
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
      Response.handleError('validateCapSumAudit', error, req, res, next);
    }
  }
}
