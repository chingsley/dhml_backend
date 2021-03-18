import express from 'express';
import {
  ADMIN,
  ENROLMENT_OFFICER,
  HOD_MEDICAL,
  HOD_VHS,
  SUPERADMIN,
  VERIFIER,
} from '../../shared/constants/roles.constants';
import AppMiddleware from '../app/app.middleware';
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
router.post(
  '/upload',
  AuthMiddleware.authorize([SUPERADMIN, ADMIN, ENROLMENT_OFFICER]),
  EnrolleeMiddleware.validateEnrolleeUpload,
  EnrolleeController.uploadEnrollees
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
  EnrolleeMiddleware.validateQuery,
  EnrolleeController.getEnrollees
);
router.get(
  '/:enrolleeId',
  AuthMiddleware.authorize([SUPERADMIN, ADMIN, ENROLMENT_OFFICER, VERIFIER]),
  AppMiddleware.validateIdParams,
  EnrolleeController.getByEnrolleeId
);

router.patch(
  '/:enrolleeId',
  AuthMiddleware.authorize([SUPERADMIN, ADMIN, VERIFIER]),
  AppMiddleware.validateIdParams,
  EnrolleeMiddleware.validateEnrolleeUpdate,
  EnrolleeController.updateEnrollee
);
router.patch(
  '/:enrolleeId/verify',
  AuthMiddleware.authorize([SUPERADMIN, ADMIN, VERIFIER]),
  AppMiddleware.validateIdParams,
  EnrolleeController.verifyEnrollee
);
router.patch(
  '/:enrolleeId/unverify',
  AuthMiddleware.authorize([SUPERADMIN, ADMIN, VERIFIER]),
  AppMiddleware.validateIdParams,
  EnrolleeController.unverifyEnrollee
);
router.delete(
  '/:enrolleeId',
  AuthMiddleware.authorize([SUPERADMIN, ADMIN]),
  AppMiddleware.validateIdParams,
  EnrolleeController.deleteEnrollee
);

export default router;
