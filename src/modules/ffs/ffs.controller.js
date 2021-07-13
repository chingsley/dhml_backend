import Response from '../../utils/Response';
import FFSService from './ffs.services';

export default class FFSController {
  static async getClaimsSumByHcp(req, res, next) {
    try {
      const ffsService = new FFSService(req);
      const data = await ffsService.getClaimsSumByHcpSvc();
      return res.status(200).json({
        data,
      });
    } catch (error) {
      Response.handleError('getClaimsSumByHcp', error, req, res, next);
    }
  }
}
