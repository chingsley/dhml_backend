import express from 'express';
import { SUPERADMIN } from '../../shared/constants/roles.constants';
import AuthMiddleware from '../auth/auth.middleware';
import RoleController from './role.controller';

const router = express.Router();

router.get(
  '/',
  AuthMiddleware.authorize([SUPERADMIN]),
  RoleController.getAllRoles
);

export default router;
