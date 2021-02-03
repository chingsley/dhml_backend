import express from 'express';
import AppMiddleware from '../app/app.middleware';
import AuthController from './auth.controller';
import AuthMiddleware from './auth.middleware';

const router = express.Router();

router.post(
  '/login',
  AppMiddleware.decryptRequestBody,
  AuthMiddleware.validateLoginDetails,
  AuthController.loginUser
);

/**
 * the first argument of authorize() is an array
 * of allowed roles; if this argument is falsy (e.g null)
 * then any role is allowed access
 */
router.post(
  '/password/change',
  AuthMiddleware.authorize(null, { rejectDefaultPassword: false }),
  AppMiddleware.decryptRequestBody,
  AuthMiddleware.validatepasswordChangeDetails,
  AuthController.changePassword
);

export default router;
