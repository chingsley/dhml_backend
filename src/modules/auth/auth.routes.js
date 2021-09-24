import express from 'express';
import AppMiddleware from '../app/app.middleware';
import AuthController from './auth.controller';
import AuthMiddleware from './auth.middleware';
import { ADMIN, SUPERADMIN, MD } from '../../shared/constants/roles.constants';

const router = express.Router();

const allowedRoles = [ADMIN, SUPERADMIN, MD];

router.post(
  '/login',
  AppMiddleware.decryptRequestBody,
  AuthMiddleware.validateLoginDetails,
  AuthController.login
);

/**
 * the first argument of authorize() is an array
 * of allowed roles; if this argument is falsy (e.g null)
 * then any role is allowed access provided the token is valid
 */
router.post(
  '/password/change',
  AuthMiddleware.authorize(null, { rejectDefaultPassword: false }),
  AppMiddleware.decryptRequestBody,
  AuthMiddleware.validatepasswordChangeDetails,
  AuthController.changePassword
);

router.post(
  '/resend_default_password',
  AuthMiddleware.authorize(allowedRoles),
  AuthMiddleware.validateAuthData,
  AuthController.resendDefaultPass
);

router.post(
  '/request_password_reset',
  AuthMiddleware.validateRequestForPasswordReset,
  AuthController.initialtePasswordReset
);

router.get('/password/reset_token', AuthController.validatePasswordResetToken);

router.get(
  '/profile',
  AuthMiddleware.authorize(null, {
    rejectDefaultPassword: false,
    rejectExpiredPassword: false,
  }),
  AuthController.getUserProfile
);

export default router;
