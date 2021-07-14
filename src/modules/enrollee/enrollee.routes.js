import express from 'express';
import {
  ADMIN,
  ENROLMENT_OFFICER,
  HOD_MEDICAL,
  HOD_VHS,
  MD,
  SUPERADMIN,
  VERIFIER,
  HCP,
} from '../../shared/constants/roles.constants';
import AppMiddleware from '../app/app.middleware';
import AuthMiddleware from '../auth/auth.middleware';
import EnrolleeController from './enrollee.controller';
import EnrolleeMiddleware from './enrollee.middleware';

const router = express.Router();

const allowedRoles = [MD, SUPERADMIN, ADMIN];

router.post(
  '/',
  AuthMiddleware.authorize([...allowedRoles, ENROLMENT_OFFICER]),
  EnrolleeMiddleware.validateNewEnrollee,
  EnrolleeController.addNewEnrollee
);
router.post(
  '/upload',
  AuthMiddleware.authorize([...allowedRoles, ENROLMENT_OFFICER]),
  EnrolleeMiddleware.validateEnrolleeUpload,
  EnrolleeController.uploadEnrollees
);
router.get(
  '/',
  AuthMiddleware.authorize([
    ...allowedRoles,
    ENROLMENT_OFFICER,
    HOD_MEDICAL,
    HOD_VHS,
    VERIFIER,
    HCP,
  ]),
  EnrolleeMiddleware.validateQuery,
  EnrolleeController.getEnrollees
);
router.get(
  '/:enrolleeId',
  AuthMiddleware.authorize([...allowedRoles, ENROLMENT_OFFICER, VERIFIER]),
  AppMiddleware.validateIdParams,
  EnrolleeController.getByEnrolleeId
);

router.patch(
  '/:enrolleeId',
  AuthMiddleware.authorize([...allowedRoles, VERIFIER]),
  AppMiddleware.validateIdParams,
  EnrolleeMiddleware.validateEnrolleeUpdate,
  EnrolleeController.updateEnrollee
);
router.patch(
  '/:enrolleeId/verify',
  AuthMiddleware.authorize([...allowedRoles, VERIFIER]),
  AppMiddleware.validateIdParams,
  EnrolleeController.verifyEnrollee
);
router.patch(
  '/:enrolleeId/unverify',
  AuthMiddleware.authorize([...allowedRoles, VERIFIER]),
  AppMiddleware.validateIdParams,
  EnrolleeController.unverifyEnrollee
);
router.delete(
  '/:enrolleeId',
  AuthMiddleware.authorize([...allowedRoles]),
  AppMiddleware.validateIdParams,
  EnrolleeController.deleteEnrollee
);

export default router;
