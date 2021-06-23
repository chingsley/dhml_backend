import express from 'express';
import roles from '../../shared/constants/roles.constants';
import AuthMiddleware from '../auth/auth.middleware';
import RefcodeMiddleware from '../refcode/refcode.middlewares';
import RefcodeController from './refcode.controllers';

const {
  SUPERADMIN,
  ADMIN,
  HOD_MEDICAL,
  VERIFIER,
  ENROLMENT_OFFICER,
  MD,
  DEPT_USER,
  HCP,
} = roles;

const allowedRoles = [ADMIN, SUPERADMIN, MD];

const router = express.Router();

router.post(
  '/',
  AuthMiddleware.authorize([
    ...allowedRoles,
    HOD_MEDICAL,
    roles.TIER_1_MEDICAL,
    roles.TIER_2_MEDICAL,
    VERIFIER,
    ENROLMENT_OFFICER,
    HCP,
  ]),
  RefcodeMiddleware.validateRequestForRefcode,
  RefcodeController.createRequestForRefcodeCTRL
);

router.get(
  '/',
  AuthMiddleware.authorize([
    ...allowedRoles,
    HOD_MEDICAL,
    roles.TIER_1_MEDICAL,
    roles.TIER_2_MEDICAL,
    VERIFIER,
    ENROLMENT_OFFICER,
    HCP,
  ]),
  RefcodeMiddleware.validateRefcodeQuery,
  RefcodeController.getReferalCodes
);

router.get(
  '/verify',
  AuthMiddleware.authorize([
    ...allowedRoles,
    HOD_MEDICAL,
    VERIFIER,
    ENROLMENT_OFFICER,
  ]),
  RefcodeMiddleware.validateRefcode,
  RefcodeController.verifyReferalCode
);

router.get(
  '/history',
  AuthMiddleware.authorize([SUPERADMIN, ADMIN, ENROLMENT_OFFICER, VERIFIER]),
  RefcodeMiddleware.validateFetchCodeHistory,
  RefcodeController.getEnrolleeCodeHistory
);
router.patch(
  '/:refcodeId/flag',
  AuthMiddleware.authorize([
    ...allowedRoles,
    HOD_MEDICAL,
    VERIFIER,
    ENROLMENT_OFFICER,
    DEPT_USER,
  ]),
  RefcodeMiddleware.validateFlagStatus,
  RefcodeController.changeFlagStatus
);
router.delete(
  '/',
  AuthMiddleware.authorize([...allowedRoles]),
  RefcodeMiddleware.validateRefcodeIdArr,
  RefcodeController.deleteRefcode
);

export default router;
