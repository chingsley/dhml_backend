import express from 'express';
import roles, {
  HCP,
  BASIC,
  ENROLMENT_OFFICER,
} from '../../shared/constants/roles.constants';
import AuthMiddleware from '../auth/auth.middleware';
import StatsController from './stats.controller';

const router = express.Router();

const allowedRoles = Object.values(roles).filter(
  (role) => ![HCP, BASIC, ENROLMENT_OFFICER].includes(role)
);

router.get(
  '/',
  AuthMiddleware.authorize([...allowedRoles]),
  StatsController.getGeneralStats
);

export default router;
