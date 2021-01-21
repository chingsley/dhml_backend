import express from 'express';
import {
  ADMIN,
  ENROLMENT_OFFICER,
  HOD_MEDICAL,
  HOD_VHS,
  SUPERADMIN,
  VERIFIER,
} from '../../shared/constants/roles.constants';
import AuthMiddleware from '../auth/auth.middleware';
import EnrolleeController from './enrollee.controller';
import EnrolleeMiddleware from './enrollee.middleware';

const router = express.Router();

router.post(
  '/',
  AuthMiddleware.authorize([SUPERADMIN, ADMIN, ENROLMENT_OFFICER]),
  EnrolleeMiddleware.validateNewEnrollee,
  EnrolleeController.addNewEnrollee
);
router.get(
  '/',
  AuthMiddleware.authorize([
    SUPERADMIN,
    ADMIN,
    ENROLMENT_OFFICER,
    HOD_MEDICAL,
    HOD_VHS,
    VERIFIER,
  ]),
  EnrolleeController.getEnrollees
);
router.patch(
  '/:enrolleeId/toggle_verify',
  AuthMiddleware.authorize([SUPERADMIN, ADMIN, VERIFIER]),
  EnrolleeController.verifyEnrollee
);
router.delete(
  '/:enrolleeId',
  AuthMiddleware.authorize([SUPERADMIN]),
  EnrolleeController.deleteEnrollee
);

export default router;
