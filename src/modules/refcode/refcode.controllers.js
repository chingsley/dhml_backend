import Response from '../../utils/Response';

export default class RefcodeController {
  static async generateNewCode(req, res, next) {
    try {
      return res
        .status(200)
        .json({ message: 'new code successfully generated' });
    } catch (error) {
      Response.handleError('generateNewCode', error, req, res, next);
    }
  }
}
