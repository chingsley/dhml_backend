import express from 'express';
import {
  ADMIN,
  DEPT_USER,
  HOD_ADMIN,
  SUPERADMIN,
} from '../../shared/constants/roles.constants';
import AuthMiddleware from '../auth/auth.middleware';
import StaffController from './staff.controller';
import StaffMiddleware from './staff.middleware';

const router = express.Router();

router.post(
  '/',
  AuthMiddleware.authorize([SUPERADMIN, ADMIN, HOD_ADMIN, DEPT_USER]),
  StaffMiddleware.validateNewStaff,
  StaffController.addNewStaff
);

router.get(
  '/',
  AuthMiddleware.authorize([SUPERADMIN]),
  StaffMiddleware.validateStaffQuery,
  StaffController.getAllStaff
);

export default router;
