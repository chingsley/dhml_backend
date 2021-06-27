import Response from '../../utils/Response';
import EnrolleeService from '../enrollee/enrollee.service';
import RefcodeService from './refcode.services';

export default class RefcodeController {
  static async createRequestForRefcodeCTRL(req, res, next) {
    try {
      const { enrolleeIdNo, ...newEnrolleeData } = req.body;

      const refcodeService = new RefcodeService(req);
      const enrolleeService = new EnrolleeService(req);
      let enrollee;
      if (!enrolleeIdNo) {
        enrollee = await enrolleeService.registerNewEnrollee(newEnrolleeData);
        req.body.enrolleeIdNo = enrollee.enrolleeIdNo;
      }
      const data = await refcodeService.createRequestForReferalCodeSVC(
        req.body
      );
      return res.status(201).json({
        message: 'Request for Referral Code has been successfully sent',
        data,
      });
    } catch (error) {
      Response.handleError('generateNewCode', error, req, res, next);
    }
  }

  static async verifyReferalCode(req, res, next) {
    try {
      const refcodeService = new RefcodeService(req);
      const data = await refcodeService.verifyRefcode();
      return res.status(200).json({ message: 'verified', data });
    } catch (error) {
      Response.handleError('verifyReferalCode', error, req, res, next);
    }
  }
  static async updateCodeRequestDetails(req, res, next) {
    try {
      const refcodeService = new RefcodeService(req);
      const data = await refcodeService.updateCodeRequestDetailsSV();
      return res
        .status(200)
        .json({ message: 'code request updated successfully', data });
    } catch (error) {
      Response.handleError('updateCodeRequestDetails', error, req, res, next);
    }
  }
  static async updateCodeRequestStatus(req, res, next) {
    try {
      const refcodeService = new RefcodeService(req);
      const data = await refcodeService.updateRefcodeStatus();
      return res
        .status(200)
        .json({ message: 'code status updated successfully', data });
    } catch (error) {
      Response.handleError('updateCodeRequestStatus', error, req, res, next);
    }
  }
  static async deleteRefcode(req, res, next) {
    try {
      const refcodeService = new RefcodeService(req);
      await refcodeService.handleCodeDelete();
      return res
        .status(200)
        .json({ message: 'The code request has been deleted successfully' });
    } catch (error) {
      Response.handleError('deleteRefcode', error, req, res, next);
    }
  }
  static async getReferalCodes(req, res, next) {
    try {
      const refcodeService = new RefcodeService(req);
      const data = await refcodeService.getRefcodes();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('getReferalCodes', error, req, res, next);
    }
  }

  static async getEnrolleeCodeHistory(req, res, next) {
    try {
      const refcodeService = new RefcodeService(req);
      const data = await refcodeService.fetchEnrolleeCodeHistory();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('getEnrolleeCodeHistory', error, req, res, next);
    }
  }
}
