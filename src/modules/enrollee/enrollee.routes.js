import express from 'express';
import {
  ADMIN,
  ENROLMENT_OFFICER,
  SUPERADMIN,
} from '../../shared/constants/roles.constants';
import AuthMiddleware from '../auth/auth.middleware';
import EnrolleeController from './enrollee.controller';
import EnrolleeMiddleware from './enrollee.middleware';

const router = express.Router();

router.post(
  '/',
  // AuthMiddleware.verifyToken,
  // AuthMiddleware.authorize([SUPERADMIN, ADMIN, ENROLMENT_OFFICER]),
  EnrolleeMiddleware.validateNewEnrollee,
  EnrolleeController.addNewEnrollee
);

router.get(
  '/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize([SUPERADMIN, ADMIN, ENROLMENT_OFFICER]),
  EnrolleeController.getEnrollees
);

export default router;
