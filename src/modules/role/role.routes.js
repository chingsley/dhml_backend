import express from 'express';
import { ADMIN, MD, SUPERADMIN } from '../../shared/constants/roles.constants';
import AuthMiddleware from '../auth/auth.middleware';
import RoleController from './role.controller';
import RoleMiddleware from './role.middleware';

const router = express.Router();

router.get(
  '/',
  AuthMiddleware.authorize([MD, SUPERADMIN, ADMIN]),
  RoleMiddleware.validateQuery,
  RoleController.getAllRoles
);

export default router;
