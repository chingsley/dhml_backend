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
  AuthMiddleware.authorizeRoleAssignment([SUPERADMIN]),
  UserController.registerUser
);
router.get(
  '/',
  AuthMiddleware.authorize([SUPERADMIN, ADMIN]),
  UserController.getAllUsers
);
router.patch(
  '/:userId',
  AuthMiddleware.authorize([SUPERADMIN, ADMIN]),
  UserMiddleware.validateUserUpdate,
  AuthMiddleware.authorizeRoleAssignment([SUPERADMIN]),
  UserController.updateUser
);
router.delete(
  '/:userId',
  AuthMiddleware.authorize([SUPERADMIN, ADMIN]),
  AuthMiddleware.authorizeRoleAssignment([SUPERADMIN]),
  UserController.deleteUser
);

export default router;
