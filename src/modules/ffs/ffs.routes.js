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
  '/monthly-ffs',
  AuthMiddleware.authorize([MD, HOD_AUDIT, HOD_ACCOUNT, ACCOUNT_OFFICER]),
  FFSMiddleware.validateQuery,
  FFSController.getFFSMonthlyPayments
);
router.get(
  '/monthly-ffs/:mfpId',
  AuthMiddleware.authorize([MD, HOD_AUDIT, HOD_ACCOUNT, ACCOUNT_OFFICER]),
  FFSMiddleware.validateQuery,
  AppMiddleware.validateIdParams,
  FFSController.getFFSMonthlyHcpBreakdown
);
router.patch(
  '/monthly-ffs/:mfpId/request-audit',
  AuthMiddleware.authorize([HOD_ACCOUNT, ACCOUNT_OFFICER]),
  AppMiddleware.validateIdParams,
  FFSMiddleware.validateFFSVoucher,
  FFSController.requestAudit
);
router.get(
  '/voucher/:mfpId',
  AppMiddleware.validateIdParams,
  AuthMiddleware.authorize([MD, HOD_AUDIT, HOD_ACCOUNT, ACCOUNT_OFFICER]),
  FFSController.getFFSVoucherByMfpId
);
router.patch(
  '/hcp-monthly-ffs/:hcpmfpId/tsa-remita',
  AuthMiddleware.authorize([HOD_ACCOUNT, ACCOUNT_OFFICER]),
  AppMiddleware.validateIdParams,
  FFSMiddleware.FFSvalidateTsaRemitaUpdate,
  FFSController.updateFFSTsaRemitaValues
);
router.patch(
  '/monthly-ffs/:mfpId/audit',
  AuthMiddleware.authorize([HOD_AUDIT]),
  AppMiddleware.validateIdParams,
  FFSMiddleware.validateFFSAudit,
  FFSController.auditFFS
);
router.patch(
  '/monthly-ffs/:mfpId/approval',
  AuthMiddleware.authorize([MD]),
  AppMiddleware.validateIdParams,
  FFSMiddleware.validateFFSApproval,
  FFSController.approveFFS
);
router.patch(
  '/monthly-ffs/:mfpId/pay',
  AuthMiddleware.authorize([HOD_ACCOUNT]),
  AppMiddleware.validateIdParams,
  FFSMiddleware.validateCancelPay,
  FFSController.payMonthlyFFS
);
router.get(
  '/selected-for-payment',
  AuthMiddleware.authorize([MD, HOD_ACCOUNT, ACCOUNT_OFFICER]),
  FFSMiddleware.validateQuery,
  FFSController.selectedFFSBreakdownByHcp
);
router.get(
  '/nhis-report',
  AuthMiddleware.authorize([MD, HOD_ACCOUNT, ACCOUNT_OFFICER]),
  AppMiddleware.requireDateQuery,
  FFSController.getFFSNhisReportByMonth
);
router.get(
  '/analysis',
  AuthMiddleware.authorize([MD, HOD_AUDIT, HOD_ACCOUNT, ACCOUNT_OFFICER]),
  AppMiddleware.validateQueryParams,
  AppMiddleware.requireDateQuery,
  FFSController.FFSAnalysisByArmOfService
);

export default router;
