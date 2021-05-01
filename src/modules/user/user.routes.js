import express from 'express';
import UserController from './user.controller';
import UserMiddleware from './user.middleware';
import AuthMiddleware from '../auth/auth.middleware';
import { ADMIN, MD, SUPERADMIN } from '../../shared/constants/roles.constants';

const router = express.Router();

const allowedRoles = [MD, SUPERADMIN, ADMIN];

router.post(
  '/',
  AuthMiddleware.authorize([...allowedRoles]),
  UserMiddleware.validateNewUser,
  AuthMiddleware.authorizeRoleAssignment([SUPERADMIN, MD]),
  UserController.registerUser
);
router.get(
  '/',
  AuthMiddleware.authorize([...allowedRoles]),
  UserController.getAllUsers
);
router.patch(
  '/:userId',
  AuthMiddleware.authorize([...allowedRoles]),
  UserMiddleware.validateUserUpdate,
  AuthMiddleware.authorizeRoleAssignment([SUPERADMIN, MD]),
  UserController.updateUser
);
router.delete(
  '/',
  AuthMiddleware.authorize([SUPERADMIN, MD]),
  UserMiddleware.validateUserIdArr,
  UserController.deleteUsers
);

export default router;
