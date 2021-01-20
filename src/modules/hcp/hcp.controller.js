import Response from '../../utils/Response';
import HcpService from './hcp.services';

export default class HcpController {
  static async getAllHcp(req, res, next) {
    try {
      const hcpService = new HcpService(req);
      const data = await hcpService.fetchAllHcp();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('getAllHcp', error, req, res, next);
    }
  }
}
