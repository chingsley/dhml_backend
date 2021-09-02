import express from 'express';
import {
  HOD_ACCOUNT,
  HOD_AUDIT,
  HOD_MEDICAL,
  HOD_PR_AND_M,
  HOD_STORES,
  HOD_VHS,
  MD,
  SA,
  SUPERADMIN,
  TIER_1_MEDICAL,
  TIER_2_MEDICAL,
} from '../../shared/constants/roles.constants';
import AuthMiddleware from '../auth/auth.middleware';
import StatsController from './stats.controller';

const router = express.Router();

const allowedRoles = [
  SA,
  SUPERADMIN,
  MD,
  HOD_ACCOUNT,
  HOD_AUDIT,
  HOD_MEDICAL,
  HOD_VHS,
  HOD_PR_AND_M,
  TIER_1_MEDICAL,
  TIER_2_MEDICAL,
  HOD_STORES,
];

router.get(
  '/',
  AuthMiddleware.authorize([...allowedRoles]),
  StatsController.getGeneralStats
);

export default router;
