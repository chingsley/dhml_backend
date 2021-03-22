import Response from '../../utils/Response';

export default class ReportsMiddleware {
  static async func(req, res, next) {
    try {
      //
    } catch (error) {
      Response.handleError('func', error, req, res, next);
    }
  }
}
