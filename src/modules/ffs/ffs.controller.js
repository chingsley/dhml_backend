import Response from '../../utils/Response';
import FFSService from './ffs.services';

export default class FFSController {
  static async getFFSMonthlyPayments(req, res, next) {
    try {
      const ffsService = new FFSService(req);
      const data = await ffsService.getFFSMonthlyPaymentsSvc();
      return res.status(200).json({
        data,
      });
    } catch (error) {
      Response.handleError('getFFSMonthlyPayments', error, req, res, next);
    }
  }
  static async getFFSMonthlyHcpBreakdown(req, res, next) {
    try {
      const ffsService = new FFSService(req);
      const data = await ffsService.getFFSMonthlyHcpBreakdownSvc();
      return res.status(200).json({
        data,
      });
    } catch (error) {
      Response.handleError('getFFSMonthlyHcpBreakdown', error, req, res, next);
    }
  }
  static async requestAudit(req, res, next) {
    try {
      const ffsService = new FFSService(req);
      const data = await ffsService.requestAuditSvc();
      return res.status(200).json({
        data,
      });
    } catch (error) {
      Response.handleError('requestAudit', error, req, res, next);
    }
  }
  static async auditFFS(req, res, next) {
    try {
      const ffsService = new FFSService(req);
      const data = await ffsService.handleFFSAudit();
      return res.status(200).json({
        data,
      });
    } catch (error) {
      Response.handleError('auditFFS', error, req, res, next);
    }
  }
  static async approveFFS(req, res, next) {
    try {
      const ffsService = new FFSService(req);
      const data = await ffsService.handleFFSApproval();
      return res.status(200).json({
        data,
      });
    } catch (error) {
      Response.handleError('approveFFS', error, req, res, next);
    }
  }
  static async getPaymentAdvice(req, res, next) {
    try {
      const ffsService = new FFSService(req);
      const data = await ffsService.getPaymentAdviceSvc();
      return res.status(200).json({
        data,
      });
    } catch (error) {
      Response.handleError('getPaymentAdvice', error, req, res, next);
    }
  }
}
