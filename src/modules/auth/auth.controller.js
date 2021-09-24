/* eslint-disable indent */
import Jwt from '../../utils/Jwt';
import Response from '../../utils/Response';
import AuthService from './auth.services';

export default class AuthController {
  static async login(req, res, next) {
    try {
      const authService = new AuthService(req);
      const { userType } = req.body;
      let data;
      if (userType === 'user') {
        data = await authService.handleUserLogin();
      } else {
        data = await authService.handleHcpLogin();
      }
      return res.status(200).json({ message: 'login successful', data });
    } catch (error) {
      Response.handleError('login', error, req, res, next);
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
  static async initialtePasswordReset(req, res, next) {
    try {
      const authService = new AuthService(req);
      const { email, userType } = req.body;
      const data = await authService.initiatePasswordResetSvc(email, userType);
      return res.status(200).json(data);
    } catch (error) {
      Response.handleError('initialtePasswordReset', error, req, res, next);
    }
  }
  static async validatePasswordResetToken(req, res, next) {
    try {
      const authService = new AuthService(req);
      const resetToken = req.headers['reset-token'];
      if (!resetToken) {
        return res.status(400).json({
          errror: 'missing "reset-token" in headers',
        });
      }
      const data = await authService.validatePasswordResetTokenSvc(resetToken);
      return res.status(200).json(data);
    } catch (error) {
      Response.handleError('validatePasswordResetToken', error, req, res, next);
    }
  }
  static async getUserProfile(req, res, next) {
    try {
      const { user, userType } = req;
      const tokenPayload =
        userType === 'user' ? { userId: user.id } : { hcpId: user.id };
      const data = {
        ...user.dataValues,
        password: undefined,
        token: Jwt.generateToken(tokenPayload),
        userType,
      };
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('resendDefaultPass', error, req, res, next);
    }
  }
}
