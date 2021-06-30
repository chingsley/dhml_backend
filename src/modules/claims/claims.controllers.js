import Response from '../../utils/Response';
import ClaimsService from './claims.services';

export default class ClaimsController {
  static async AddNewClaim(req, res, next) {
    try {
      const claimsService = new ClaimsService(req);
      const data = await claimsService.addNewClaimSvc();
      return res.status(201).json({
        message: 'Claim successfully submitted',
        data,
      });
    } catch (error) {
      Response.handleError('AddNewClaim', error, req, res, next);
    }
  }
}
