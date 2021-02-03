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
      if (req.user) {
        data = await authService.changeUserPassword(req.user);
      } else {
        // console.log(req.hcpId);
        data = await authService.changeHcpPassword(req.hcp);
      }
      return res
        .status(200)
        .json({ message: 'Password changed was successful', data });
    } catch (error) {
      Response.handleError('loginUser', error, req, res, next);
    }
  }
}
