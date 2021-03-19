import Response from '../../utils/Response';
import ReportService from './reports.services';

export default class ReportsController {
  static async getMonthlyCapitationSummary(req, res, next) {
    try {
      const reportService = new ReportService(req);
      const data = await reportService.getAllCapitationApprovals();
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
}
