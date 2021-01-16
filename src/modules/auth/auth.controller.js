import AppController from '../app/app.controller';
import AuthService from './auth.services';

export default class AuthController extends AppController {
  static async loginUser(req, res, next) {
    try {
      const authService = new AuthService(req, res);
      const data = await authService.handleLogin();
      return res.status(200).json({ message: 'login succesful', data });
    } catch (error) {
      AuthController.handleError(error, req, res, next);
    }
  }

  static async requestPasswordReset(req, res, next) {
    try {
      const authService = new AuthService(req, res);
      await authService.initiatePasswordReset();
      return res.status(200).json({
        message: `Please check your inbox ${req.body.email} for password reset instructions.`,
      });
    } catch (error) {
      AuthController.handleError(error, req, res, next);
    }
  }

  static async validatePasswordResetToken(req, res, next) {
    try {
      const authService = new AuthService(req, res);
      const user = await authService.handleResetTokenValidation();
      return res.status(200).json({
        message: 'successfully validated reset token',
        isValidPasswordResetToken: true,
        user,
      });
    } catch (error) {
      AuthController.handleError(error, req, res, next);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const authService = new AuthService(req, res);
      await authService.handlePasswordUpdate();
      return res
        .status(200)
        .json({ message: 'Your password was successfully updated' });
    } catch (error) {
      AuthController.handleError(error, req, res, next);
    }
  }
}
