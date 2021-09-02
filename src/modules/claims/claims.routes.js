import express from 'express';
import AuthMiddleware from '../auth/auth.middleware';
import ClaimsController from './claims.controllers';
import ClaimsMiddleware from './claims.middlewares';
import AppMiddleware from '../app/app.middleware';
import {
  HCP,
  HOD_MEDICAL,
  MD,
  SA,
  SUPERADMIN,
  TIER_1_MEDICAL,
  TIER_2_MEDICAL,
} from '../../shared/constants/roles.constants';

const router = express.Router();

const ALLOWED_ROLES = [
  MD,
  SA,
  HCP,
  HOD_MEDICAL,
  TIER_1_MEDICAL,
  TIER_2_MEDICAL,
  SUPERADMIN,
];

router.post(
  '/',
  AuthMiddleware.authorize([...ALLOWED_ROLES]),
  ClaimsMiddleware.validateNewClaim,
  ClaimsController.addNewClaim
);

router.get(
  '/',
  AuthMiddleware.authorize([...ALLOWED_ROLES]),
  ClaimsMiddleware.validateClaimsSearchQuery,
  ClaimsController.getClaims
);

router.patch(
  '/',
  AuthMiddleware.authorize([...ALLOWED_ROLES]),
  ClaimsMiddleware.validateBulkClaimProcessing,
  ClaimsController.processBulkClaims
);

router.patch(
  '/:claimId',
  AuthMiddleware.authorize([...ALLOWED_ROLES]),
  AppMiddleware.validateIdParams,
  ClaimsMiddleware.validatePatchUpdateByIdParam,
  ClaimsController.updateClaimByIdParam
);

router.delete(
  '/:claimId',
  AuthMiddleware.authorize([...ALLOWED_ROLES]),
  AppMiddleware.validateIdParams,
  ClaimsController.deleteClaimByIdParam
);

export default router;
