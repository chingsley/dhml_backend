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
  static async getClaims(req, res, next) {
    try {
      const claimsService = new ClaimsService(req);
      const data = await claimsService.getClaimsSvc();
      return res.status(200).json({
        data,
      });
    } catch (error) {
      Response.handleError('getClaims', error, req, res, next);
    }
  }
  static async getSingleClaimById(req, res, next) {
    try {
      const claimsService = new ClaimsService(req);
      const data = await claimsService.getSingleClaimByIdSvc();
      return res.status(200).json({
        data,
      });
    } catch (error) {
      Response.handleError('getSingleClaimById', error, req, res, next);
    }
  }
  static async updateClaimByIdParam(req, res, next) {
    try {
      const claimsService = new ClaimsService(req);
      const data = await claimsService.updateByIdParam();
      return res.status(200).json({
        message: 'Claim successfully updated',
        data,
      });
    } catch (error) {
      Response.handleError('updateClaimByIdParam', error, req, res, next);
    }
  }
  static async processBulkClaims(req, res, next) {
    try {
      const claimsService = new ClaimsService(req);
      const data = await claimsService.handleBulkClaimProcessing();
      return res.status(200).json({
        message: 'Claim successfully updated',
        data,
      });
    } catch (error) {
      Response.handleError('processBulkClaims', error, req, res, next);
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
