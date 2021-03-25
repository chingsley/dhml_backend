import express from 'express';
import {
  ADMIN,
  DEPT_USER,
  ENROLMENT_OFFICER,
  HOD_ADMIN,
  MD,
  SUPERADMIN,
  VERIFIER,
} from '../../shared/constants/roles.constants';
import AppMiddleware from '../app/app.middleware';
import AuthMiddleware from '../auth/auth.middleware';
import StaffController from './staff.controller';
import StaffMiddleware from './staff.middleware';

const router = express.Router();

router.post(
  '/',
  AuthMiddleware.authorize([MD, SUPERADMIN, ADMIN, HOD_ADMIN]),
  StaffMiddleware.validateNewStaff,
  StaffController.addNewStaff
);
router.patch(
  '/:staffId',
  AuthMiddleware.authorize([MD, SUPERADMIN, ADMIN, HOD_ADMIN]),
  AppMiddleware.validateIdParams,
  StaffMiddleware.validateStaffUpdate,
  StaffController.updateStaff
);

router.get(
  '/',
  AuthMiddleware.authorize([
    MD,
    SUPERADMIN,
    HOD_ADMIN,
    VERIFIER,
    ENROLMENT_OFFICER,
    DEPT_USER,
  ]),
  StaffMiddleware.validateStaffQuery,
  StaffController.getAllStaff
);

export default router;
