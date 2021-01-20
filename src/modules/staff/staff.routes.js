import express from 'express';
import { SUPERADMIN } from '../../shared/constants/roles.constants';
import AuthMiddleware from '../auth/auth.middleware';
import StaffController from './staff.controller';
import StaffMiddleware from './staff.middleware';

const router = express.Router();

router.get(
  '/',
  AuthMiddleware.authorize([SUPERADMIN]),
  StaffMiddleware.validateStaffQuery,
  StaffController.getAllStaff
);

export default router;
