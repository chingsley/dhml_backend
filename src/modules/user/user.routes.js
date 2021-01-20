import express from 'express';
import UserController from './user.controller';
import UserMiddleware from './user.middleware';
import AuthMiddleware from '../auth/auth.middleware';
import { ADMIN, SUPERADMIN } from '../../shared/constants/roles.constants';

const router = express.Router();

router.post(
  '/',
  AuthMiddleware.authorize([SUPERADMIN, ADMIN]),
  UserMiddleware.validateNewUser,
  UserController.registerUser
);
router.get(
  '/',
  AuthMiddleware.authorize([SUPERADMIN, ADMIN]),
  UserController.getAllUsers
);

export default router;
