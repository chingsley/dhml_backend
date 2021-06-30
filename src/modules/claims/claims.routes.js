import express from 'express';
import roles from '../../shared/constants/roles.constants';
import AuthMiddleware from '../auth/auth.middleware';
import ClaimsController from './claims.controllers';
import ClaimsMiddleware from './claims.middlewares';

const { HCP } = roles;

const router = express.Router();

router.post(
  '/',
  AuthMiddleware.authorize([HCP]),
  ClaimsMiddleware.validateNewClaim,
  ClaimsController.AddNewClaim
);

export default router;
