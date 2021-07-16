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
}
