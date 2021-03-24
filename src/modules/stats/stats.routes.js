import express from 'express';
import {
  HOD_ACCOUNT,
  HOD_AUDIT,
  MD,
  SUPERADMIN,
} from '../../shared/constants/roles.constants';
import AuthMiddleware from '../auth/auth.middleware';
import StatsController from './stats.controller';

const router = express.Router();

const allowedRoles = [SUPERADMIN, MD, HOD_ACCOUNT, HOD_AUDIT];

router.get(
  '/',
  AuthMiddleware.authorize([...allowedRoles]),
  StatsController.getGeneralStats
);

export default router;
