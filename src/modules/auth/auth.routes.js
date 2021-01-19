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

router.post(
  '/password/change',
  AuthMiddleware.authorizeUserWithValidToken,
  AppMiddleware.decryptRequestBody,
  AuthMiddleware.validatepasswordChangeDetails,
  AuthController.changePassword
);

export default router;
