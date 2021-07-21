import express from 'express';
import AuthMiddleware from '../auth/auth.middleware';
import FFSMiddleware from './ffs.middleware';
import AppMiddleware from '../app/app.middleware';
import {
  ACCOUNT_OFFICER,
  MD,
  HOD_ACCOUNT,
  HOD_AUDIT,
} from '../../shared/constants/roles.constants';
import FFSController from './ffs.controller';

const router = express.Router();

router.get(
  '/monthly-payments',
  AuthMiddleware.authorize([MD, HOD_AUDIT, HOD_ACCOUNT, ACCOUNT_OFFICER]),
  FFSMiddleware.validateQuery,
  FFSController.getFFSMonthlyPayments
);
router.get(
  '/monthly-payments/:mfpId',
  AuthMiddleware.authorize([MD, HOD_AUDIT, HOD_ACCOUNT, ACCOUNT_OFFICER]),
  FFSMiddleware.validateQuery,
  AppMiddleware.validateIdParams,
  FFSController.getFFSMonthlyHcpBreakdown
);
router.patch(
  '/monthly-payments/:mfpId/request-audit',
  AuthMiddleware.authorize([HOD_ACCOUNT, ACCOUNT_OFFICER]),
  AppMiddleware.validateIdParams,
  FFSMiddleware.validateAuditRequest,
  FFSController.requestAudit
);
router.patch(
  '/monthly-payments/:mfpId/audit',
  AuthMiddleware.authorize([HOD_AUDIT]),
  AppMiddleware.validateIdParams,
  FFSMiddleware.validateFFSAudit,
  FFSController.auditFFS
);
router.get(
  '/payment-advice',
  AuthMiddleware.authorize([MD, HOD_ACCOUNT, ACCOUNT_OFFICER]),
  FFSMiddleware.validateQuery,
  FFSController.getPaymentAdvice
);

export default router;
