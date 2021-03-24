import Response from '../../utils/Response';
import StatsService from './stats.services';

export default class StatsController {
  static async getGeneralStats(req, res, next) {
    try {
      const reportService = new StatsService(req);
      const data = await reportService.getGeneralStatistics();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('getGeneralStats', error, req, res, next);
    }
  }
}
