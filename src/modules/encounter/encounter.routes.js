import express from 'express';
import roles from '../../shared/constants/roles.constants';
import AppMiddleware from '../app/app.middleware';
import AuthMiddleware from '../auth/auth.middleware';
import EncounterMiddleware from './encounter.middleware';
import EncounterController from './encounter.controller';

const { HCP, MD, SUPERADMIN, HOD_MEDICAL, HOD_PR_AND_M, HOD_VHS } = roles;

const statsViewers = [MD, SUPERADMIN, HOD_MEDICAL, HOD_PR_AND_M, HOD_VHS];

const router = express.Router();

router.post(
  '/',
  AuthMiddleware.authorize([HCP]),
  EncounterMiddleware.validateEncounter,
  EncounterController.recordEncounterCTRL
);

router.get(
  '/stats',
  AuthMiddleware.authorize(statsViewers),
  AppMiddleware.requireDateQuery,
  AppMiddleware.validateQueryParams,
  EncounterController.getEncounterStats
);

export default router;
