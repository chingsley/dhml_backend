import express from 'express';
import {
  HOD_ACCOUNT,
  HOD_AUDIT,
  HOD_MEDICAL,
  HOD_PR_AND_M,
  HOD_VHS,
  MD,
  SUPERADMIN,
} from '../../shared/constants/roles.constants';
import AuthMiddleware from '../auth/auth.middleware';
import StatsController from './stats.controller';

const router = express.Router();

const allowedRoles = [
  SUPERADMIN,
  MD,
  HOD_ACCOUNT,
  HOD_AUDIT,
  HOD_MEDICAL,
  HOD_VHS,
  HOD_PR_AND_M,
];

router.get(
  '/',
  AuthMiddleware.authorize([...allowedRoles]),
  StatsController.getGeneralStats
);

export default router;
