import express from 'express';
import AuthMiddleware from '../auth/auth.middleware';
import FFSMiddleware from './ffs.middleware';
import {
  ACCOUNT_OFFICER,
  MD,
  HOD_ACCOUNT,
} from '../../shared/constants/roles.constants';
import FFSController from './ffs.controller';

const router = express.Router();

router.get(
  '/claims-sum-by-hcp',
  AuthMiddleware.authorize([MD, HOD_ACCOUNT, ACCOUNT_OFFICER]),
  FFSMiddleware.validateQuery,
  FFSController.getClaimsSumByHcp
);

export default router;
