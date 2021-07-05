import express from 'express';
import roles from '../../shared/constants/roles.constants';
import AppMiddleware from '../app/app.middleware';
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
  '/get-one',
  AuthMiddleware.authorize([
    ...allowedRoles,
    HOD_MEDICAL,
    roles.TIER_1_MEDICAL,
    roles.TIER_2_MEDICAL,
    VERIFIER,
    ENROLMENT_OFFICER,
  ]),
  RefcodeMiddleware.validateGetOneRefcode,
  RefcodeController.getOneRefcodeCtr
);

router.get(
  '/history',
  AuthMiddleware.authorize([
    SUPERADMIN,
    ADMIN,
    ENROLMENT_OFFICER,
    VERIFIER,
    HOD_MEDICAL,
    roles.TIER_1_MEDICAL,
    roles.TIER_2_MEDICAL,
  ]),
  RefcodeMiddleware.validateFetchCodeHistory,
  RefcodeController.getEnrolleeCodeHistory
);
router.patch(
  '/:refcodeId',
  AuthMiddleware.authorize([
    ...allowedRoles,
    HOD_MEDICAL,
    roles.TIER_1_MEDICAL,
    roles.TIER_2_MEDICAL,
    VERIFIER,
    ENROLMENT_OFFICER,
    DEPT_USER,
  ]),
  AppMiddleware.validateIdParams,
  RefcodeMiddleware.validateCodeDetailsUpdate,
  RefcodeController.updateCodeRequestDetails
);
router.patch(
  '/:refcodeId/status',
  AuthMiddleware.authorize([
    ...allowedRoles,
    HOD_MEDICAL,
    roles.TIER_1_MEDICAL,
    roles.TIER_2_MEDICAL,
    VERIFIER,
    ENROLMENT_OFFICER,
    DEPT_USER,
  ]),
  AppMiddleware.validateIdParams,
  RefcodeMiddleware.validateCodeStatusUpdate,
  RefcodeController.updateCodeRequestStatus
);
router.patch(
  '/:refcodeId/verify-claims',
  AuthMiddleware.authorize([
    MD,
    HOD_MEDICAL,
    roles.TIER_1_MEDICAL,
    roles.TIER_2_MEDICAL,
  ]),
  AppMiddleware.validateIdParams,
  RefcodeMiddleware.validateClaimsVerification,
  RefcodeController.verifyClaims
);
router.delete(
  '/:refcodeId',
  AuthMiddleware.authorize([MD, roles.TIER_1_MEDICAL, roles.TIER_2_MEDICAL]),
  AppMiddleware.validateIdParams,
  RefcodeController.deleteRefcode
);

export default router;
