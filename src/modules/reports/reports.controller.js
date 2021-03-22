import Response from '../../utils/Response';
import ReportService from './reports.services';

export default class ReportsController {
  static async getMonthlyCapitationSummary(req, res, next) {
    try {
      const reportService = new ReportService(req);
      const userRole = req.user?.role?.title;
      const data = await reportService.getAllCapitationApprovals(userRole);
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError(
        'getMonthlyCapitationSummary',
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
}
