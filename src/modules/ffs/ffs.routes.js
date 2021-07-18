import express from 'express';
import AuthMiddleware from '../auth/auth.middleware';
import FFSMiddleware from './ffs.middleware';
import AppMiddleware from '../app/app.middleware';
import {
  ACCOUNT_OFFICER,
  MD,
  HOD_ACCOUNT,
} from '../../shared/constants/roles.constants';
import FFSController from './ffs.controller';

const router = express.Router();

router.get(
  '/monthly-payments',
  AuthMiddleware.authorize([MD, HOD_ACCOUNT, ACCOUNT_OFFICER]),
  FFSMiddleware.validateQuery,
  FFSController.getFFSMonthlyPayments
);
router.get(
  '/monthly-payments/:mfpId',
  AuthMiddleware.authorize([MD, HOD_ACCOUNT, ACCOUNT_OFFICER]),
  FFSMiddleware.validateQuery,
  AppMiddleware.validateIdParams,
  FFSController.getFFSMonthlyHcpBreakdown
);

export default router;
