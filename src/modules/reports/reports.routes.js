import express from 'express';
import {
  HOD_ACCOUNT,
  HOD_AUDIT,
  MD,
  SUPERADMIN,
} from '../../shared/constants/roles.constants';
import AuthMiddleware from '../auth/auth.middleware';
import ReportsController from './reports.controller';

const router = express.Router();

const allowedRoles = [SUPERADMIN, MD, HOD_ACCOUNT, HOD_AUDIT];

router.get(
  '/capitation',
  AuthMiddleware.authorize([...allowedRoles]),
  ReportsController.getMonthlyCapitationSummary
);

export default router;
