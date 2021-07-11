import express from 'express';
import roles from '../../shared/constants/roles.constants';
import AuthMiddleware from '../auth/auth.middleware';
import ClaimsController from './claims.controllers';
import ClaimsMiddleware from './claims.middlewares';
import AppMiddleware from '../app/app.middleware';

const { HCP, MD, TIER_1_MEDICAL, TIER_2_MEDICAL } = roles;

const router = express.Router();

router.post(
  '/',
  AuthMiddleware.authorize([MD, HCP, TIER_1_MEDICAL, TIER_2_MEDICAL]),
  ClaimsMiddleware.validateNewClaim,
  ClaimsController.addNewClaim
);

router.get(
  '/',
  AuthMiddleware.authorize([MD, HCP, TIER_1_MEDICAL, TIER_2_MEDICAL]),
  ClaimsMiddleware.validateClaimsSearchQuery,
  ClaimsController.getClaims
);

router.patch(
  '/',
  AuthMiddleware.authorize([MD, HCP, TIER_1_MEDICAL, TIER_2_MEDICAL]),
  ClaimsMiddleware.validateBulkClaimProcessing,
  ClaimsController.processBulkClaims
);

router.patch(
  '/:claimId',
  AuthMiddleware.authorize([MD, HCP, TIER_1_MEDICAL, TIER_2_MEDICAL]),
  AppMiddleware.validateIdParams,
  ClaimsMiddleware.validatePatchUpdateByIdParam,
  ClaimsController.updateClaimByIdParam
);

router.delete(
  '/:claimId',
  AuthMiddleware.authorize([MD, HCP, TIER_1_MEDICAL, TIER_2_MEDICAL]),
  AppMiddleware.validateIdParams,
  ClaimsController.deleteClaimByIdParam
);

export default router;
