import express from 'express';
import {
  ACCOUNT_OFFICER,
  HOD_ACCOUNT,
  HOD_AUDIT,
  HOD_MEDICAL,
  HOD_PR_AND_M,
  HOD_VHS,
  MD,
  SA,
  SUPERADMIN,
} from '../../shared/constants/roles.constants';
import AppMiddleware from '../app/app.middleware';
import AuthMiddleware from '../auth/auth.middleware';
import ReportsController from './reports.controller';
import ReportsMiddleware from './reports.middleware';

const router = express.Router();

const allowedRoles = [
  SUPERADMIN,
  MD,
  HOD_ACCOUNT,
  HOD_AUDIT,
  ACCOUNT_OFFICER,
  SA,
  HOD_PR_AND_M,
  HOD_MEDICAL,
  HOD_VHS,
];

router.get(
  '/capitation',
  AuthMiddleware.authorize([...allowedRoles]),
  ReportsController.getGeneralMonthlyCapitation
);
router.get(
  '/capitation/analysis',
  AuthMiddleware.authorize([...allowedRoles]),
  AppMiddleware.validateQueryParams,
  AppMiddleware.requireDateQuery,
  ReportsController.getCapitationByArmOfService
);
router.patch(
  '/capitation/:summaryId/approval',
  AuthMiddleware.authorize([MD]),
  AppMiddleware.validateIdParams,
  ReportsMiddleware.validateCapSumApproval,
  ReportsController.approveMonthlyCapitationSummary
);
router.patch(
  '/capitation/:summaryId/audit',
  AuthMiddleware.authorize([HOD_AUDIT]),
  AppMiddleware.validateIdParams,
  ReportsMiddleware.validateCapSumAudit,
  ReportsController.auditMonthlyCapitationSummary
);
router.patch(
  '/capitation/:summaryId/pay',
  AuthMiddleware.authorize([HOD_ACCOUNT]),
  AppMiddleware.validateIdParams,
  ReportsController.payMonthlyCapitation
);

export default router;
