import Response from '../../utils/Response';
import AccountService from './account.services';

export default class AccountController {
  static async getApprovedMonthSpecificCapitation(req, res, next) {
    try {
      const accountService = new AccountService(req);
      const data = await accountService.getMonthSpecificCaps();
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

  static async updateTsaRemitaValues(req, res, next) {
    try {
      const accountService = new AccountService(req);
      const data = await accountService.updateTsaRemita();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('updateTsaRemitaValues', error, req, res, next);
    }
  }

  static async getPaymentConfirmation(req, res, next) {
    try {
      const accountService = new AccountService(req);
      const data = await accountService.fetchPaymentConfirmation();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('getPaymentConfirmation', error, req, res, next);
    }
  }
  static async getNhisReport(req, res, next) {
    try {
      const accountService = new AccountService(req);
      const data = await accountService.fetchNhisReport();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('getNhisReport', error, req, res, next);
    }
  }
}
