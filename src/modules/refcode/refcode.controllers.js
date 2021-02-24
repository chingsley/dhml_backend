import Response from '../../utils/Response';
import RefcodeService from './refcode.services';

export default class RefcodeController {
  static async generateNewCode(req, res, next) {
    try {
      const refcodeService = new RefcodeService(req);
      const data = await refcodeService.generateReferalCode();
      return res
        .status(201)
        .json({ message: 'new code successfully generated', data });
    } catch (error) {
      Response.handleError('generateNewCode', error, req, res, next);
    }
  }
}
