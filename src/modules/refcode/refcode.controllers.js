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
  static async verifyReferalCode(req, res, next) {
    try {
      const refcodeService = new RefcodeService(req);
      const data = await refcodeService.verifyRefcode();
      return res.status(201).json({ message: 'verified', data });
    } catch (error) {
      Response.handleError('verifyReferalCode', error, req, res, next);
    }
  }
}

// reg. dep and dsship
// another layer of approval before fff goes to account
// remarks when editing claims
// code lifespan
// used once and expires after lifespan like recharge card, after 4 months, the code becomes stale
