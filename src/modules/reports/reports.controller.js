import Response from '../../utils/Response';
import ReportService from './reports.services';

export default class ReportsController {
  static async getGeneralMonthlyCapitation(req, res, next) {
    try {
      const reportService = new ReportService(req);
      const userRole = req.user?.role?.title;
      const data = await reportService.getGeneralMonthlyCap(userRole);
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError(
        'getGeneralMonthlyCapitation',
        error,
        req,
        res,
        next
      );
    }
  }
  static async approveMonthlyCapitationSummary(req, res, next) {
    try {
      const reportService = new ReportService(req);
      const data = await reportService.approveMonthlyCapSum();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError(
        'approveMonthlyCapitationSummary',
        error,
        req,
        res,
        next
      );
    }
  }
  static async auditMonthlyCapitationSummary(req, res, next) {
    try {
      const reportService = new ReportService(req);
      const data = await reportService.auditMonthlyCapSum();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError(
        'auditMonthlyCapitationSummary',
        error,
        req,
        res,
        next
      );
    }
  }
  static async payMonthlyCapitation(req, res, next) {
    try {
      const reportService = new ReportService(req);
      const data = await reportService.payMonthlyCapSum();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('payMonthlyCapitation', error, req, res, next);
    }
  }
  static async getCapitationByArmOfService(req, res, next) {
    try {
      const reportService = new ReportService(req);
      const data = await reportService.getCapByArmOfService();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError(
        'getCapitationByArmOfService',
        error,
        req,
        res,
        next
      );
    }
  }
}
