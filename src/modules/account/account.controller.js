import Response from '../../utils/Response';
import AccountService from './account.services';

export default class AccountController {
  static async getApprovedMonthSpecificCapitation(req, res, next) {
    try {
      const capitationService = new AccountService(req);
      const data = await capitationService.getMonthSpecificCaps();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError(
        'getApprovedMonthSpecificCapitation',
        error,
        req,
        res,
        next
      );
    }
  }
}
