import express from 'express';
import AuthMiddleware from '../auth/auth.middleware';
import FFSMiddleware from './ffs.middleware';
import AppMiddleware from '../app/app.middleware';
import {
  ACCOUNT_OFFICER,
  MD,
  HOD_ACCOUNT,
  HOD_AUDIT,
  HOD_MEDICAL,
  TIER_1_MEDICAL,
  TIER_2_MEDICAL,
  HOD_PR_AND_M,
  SA,
} from '../../shared/constants/roles.constants';
import FFSController from './ffs.controller';

const router = express.Router();

const CAN_VIEW_FFS_DETIAILS = [
  MD,
  HOD_AUDIT,
  HOD_ACCOUNT,
  ACCOUNT_OFFICER,
  HOD_MEDICAL,
  TIER_1_MEDICAL,
  TIER_2_MEDICAL,
  HOD_PR_AND_M,
  SA,
];

router.get(
  '/monthly-ffs',
  AuthMiddleware.authorize(CAN_VIEW_FFS_DETIAILS),
  FFSMiddleware.validateQuery,
  FFSController.getFFSMonthlyPayments
);
router.get(
  '/monthly-ffs/:mfpId',
  AuthMiddleware.authorize(CAN_VIEW_FFS_DETIAILS),
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
  AuthMiddleware.authorize(CAN_VIEW_FFS_DETIAILS),
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
  AuthMiddleware.authorize(CAN_VIEW_FFS_DETIAILS),
  FFSMiddleware.validateQuery,
  FFSController.selectedFFSBreakdownByHcp
);
router.get(
  '/nhis-report',
  AuthMiddleware.authorize(CAN_VIEW_FFS_DETIAILS),
  AppMiddleware.requireDateQuery,
  FFSController.getFFSNhisReportByMonth
);
router.get(
  '/analysis',
  AuthMiddleware.authorize(CAN_VIEW_FFS_DETIAILS),
  AppMiddleware.validateQueryParams,
  AppMiddleware.requireDateQuery,
  FFSController.FFSAnalysisByArmOfService
);
router.post(
  '/hcp-monthyly-payments/:hcpmfpId/mail',
  AuthMiddleware.authorize([HOD_ACCOUNT, ACCOUNT_OFFICER]),
  AppMiddleware.validateIdParams,
  FFSController.sendFFSPaymentAdvice
);

export default router;
