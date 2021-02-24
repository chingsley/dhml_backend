import express from 'express';
import roles from '../../shared/constants/roles.constants';
import AuthMiddleware from '../auth/auth.middleware';
import RefcodeController from './refcode.controllers';

const { SUPERADMIN } = roles;

const router = express.Router();

router.post(
  '/',
  AuthMiddleware.authorize([SUPERADMIN]),
  RefcodeController.generateNewCode
);

export default router;
