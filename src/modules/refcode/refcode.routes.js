import express from 'express';
import roles from '../../shared/constants/roles.constants';
import AuthMiddleware from '../auth/auth.middleware';
import RefcodeMiddleware from '../refcode/refcode.middlewares';
import RefcodeController from './refcode.controllers';

const { SUPERADMIN } = roles;

const router = express.Router();

router.post(
  '/',
  AuthMiddleware.authorize([SUPERADMIN]),
  RefcodeMiddleware.validateNewRefcode,
  RefcodeController.generateNewCode
);

export default router;
