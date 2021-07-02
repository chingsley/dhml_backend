import express from 'express';
import roles, {
  TIER_1_MEDICAL,
  TIER_2_MEDICAL,
} from '../../shared/constants/roles.constants';
import AuthMiddleware from '../auth/auth.middleware';
import ClaimsController from './claims.controllers';
import ClaimsMiddleware from './claims.middlewares';
import AppMiddleware from '../app/app.middleware';

const { HCP } = roles;

const router = express.Router();

router.post(
  '/',
  AuthMiddleware.authorize([HCP, TIER_1_MEDICAL, TIER_2_MEDICAL]),
  ClaimsMiddleware.validateNewClaim,
  ClaimsController.addNewClaim
);

router.patch(
  '/:claimId',
  AuthMiddleware.authorize([HCP, TIER_1_MEDICAL, TIER_2_MEDICAL]),
  AppMiddleware.validateIdParams,
  ClaimsMiddleware.validatePatchUpdateByIdParam,
  ClaimsController.UpdateClaimByIdParam
);

export default router;
