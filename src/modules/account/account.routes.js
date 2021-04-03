import express from 'express';
import {
  ACCOUNT_OFFICER,
  HOD_ACCOUNT,
  HOD_AUDIT,
  MD,
  SUPERADMIN,
} from '../../shared/constants/roles.constants';
import AppMiddleware from '../app/app.middleware';
import AuthMiddleware from '../auth/auth.middleware';
import AccountController from './account.controller';
import AccountMiddleware from './account.middleware';

const router = express.Router();

const allowedRoles = [SUPERADMIN, MD, HOD_ACCOUNT, HOD_AUDIT];

router.get(
  '/capitation',
  AuthMiddleware.authorize([...allowedRoles]),
  AppMiddleware.requireDateQuery,
  AccountController.getApprovedMonthSpecificCapitation
);
router.patch(
  '/capitation/:capitationId',
  AuthMiddleware.authorize([HOD_ACCOUNT, ACCOUNT_OFFICER]),
  AppMiddleware.validateIdParams,
  AccountMiddleware.validateTsaRemitaUpdate,
  AccountController.updateTsaRemitaValues
);
router.get(
  '/capitation/payment_confirmation',
  AuthMiddleware.authorize([...allowedRoles]),
  AppMiddleware.validateQueryParams,
  AppMiddleware.requireDateQuery,
  AccountController.getPaymentConfirmation
);
router.get(
  '/capitation/nhis_report',
  AuthMiddleware.authorize([...allowedRoles, ACCOUNT_OFFICER]),
  AppMiddleware.validateQueryParams,
  AppMiddleware.requireDateQuery,
  AccountController.getNhisReport
);

export default router;
