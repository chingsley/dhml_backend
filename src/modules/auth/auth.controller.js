import Response from '../../utils/Response';
import AuthService from './auth.services';

export default class AuthController {
  static async loginUser(req, res, next) {
    try {
      const authService = new AuthService(req.body);
      const data = await authService.handleLogin();
      return res.status(200).json({ message: 'login succesful', data });
    } catch (error) {
      Response.handleError('loginUser', error, req, res, next);
    }
  }
}
