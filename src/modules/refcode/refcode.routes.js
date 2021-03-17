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
} = roles;

const ADMIN_AND_HIGHER = [ADMIN, SUPERADMIN, MD];

const router = express.Router();

router.post(
  '/',
  AuthMiddleware.authorize([
    ...ADMIN_AND_HIGHER,
    HOD_MEDICAL,
    VERIFIER,
    ENROLMENT_OFFICER,
  ]),
  RefcodeMiddleware.validateNewRefcode,
  RefcodeController.generateNewCode
);
router.get(
  '/',
  AuthMiddleware.authorize([
    ...ADMIN_AND_HIGHER,
    HOD_MEDICAL,
    VERIFIER,
    ENROLMENT_OFFICER,
  ]),
  RefcodeMiddleware.validateRefcodeQuery,
  RefcodeController.getReferalCodes
);

router.get(
  '/verify',
  AuthMiddleware.authorize([
    ...ADMIN_AND_HIGHER,
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
    ...ADMIN_AND_HIGHER,
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
  AuthMiddleware.authorize([...ADMIN_AND_HIGHER]),
  RefcodeMiddleware.validateRefcodeIdArr,
  RefcodeController.deleteRefcode
);

export default router;
