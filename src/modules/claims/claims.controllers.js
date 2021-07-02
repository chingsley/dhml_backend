import Response from '../../utils/Response';
import ClaimsService from './claims.services';

export default class ClaimsController {
  static async addNewClaim(req, res, next) {
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
  static async UpdateClaimByIdParam(req, res, next) {
    try {
      const claimsService = new ClaimsService(req);
      const data = await claimsService.updateByIdParam();
      return res.status(200).json({
        message: 'Claim successfully updated',
        data,
      });
    } catch (error) {
      Response.handleError('UpdateClaimByIdParam', error, req, res, next);
    }
  }
  static async deleteClaimByIdParam(req, res, next) {
    try {
      const claimsService = new ClaimsService(req);
      const data = await claimsService.deleteByIdParam();
      return res.status(200).json({
        message: 'Claim successfully deleted',
        data,
      });
    } catch (error) {
      Response.handleError('deleteClaimByIdParam', error, req, res, next);
    }
  }
}
