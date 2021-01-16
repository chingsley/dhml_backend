export default class AppController {
  static handleError(error, req, res, next) {
    try {
      const { status, err, ...rest } = JSON.parse(error.message);
      return res.status(status).json({ error: err, ...rest });
    } catch (e) {
      return next(error.message);
    }
  }
}
