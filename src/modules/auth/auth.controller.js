import Response from '../../utils/Response';
import AuthService from './auth.services';

export default class AuthController {
  static async loginUser(req, res, next) {
    try {
      const authService = new AuthService(req);
      const { loginType } = req.body;
      let data;
      if (loginType === 'user') {
        data = await authService.handleUserLogin();
      } else {
        data = await authService.handleHcpLogin();
      }
      return res.status(200).json({ message: 'login successful', data });
    } catch (error) {
      Response.handleError('loginUser', error, req, res, next);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const authService = new AuthService(req);
      let data;
      if (req.userType === 'user') {
        data = await authService.changeUserPassword(req.user);
      } else {
        data = await authService.changeHcpPassword(req.user);
      }
      return res
        .status(200)
        .json({ message: 'Password changed was successful', data });
    } catch (error) {
      Response.handleError('changePassword', error, req, res, next);
    }
  }
  static async resendDefaultPass(req, res, next) {
    try {
      const authService = new AuthService(req);
      const data = await authService.resendDefaultPassword();
      return res.status(200).json(data);
    } catch (error) {
      Response.handleError('resendDefaultPass', error, req, res, next);
    }
  }
}
