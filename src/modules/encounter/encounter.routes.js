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
  '/total',
  AuthMiddleware.authorize(statsViewers),
  AppMiddleware.requireMonthQuery,
  AppMiddleware.validateQueryParams,
  EncounterController.getTotalEncounterForGivenMonth
);
router.get(
  '/avg-encounter-per-hcp',
  AuthMiddleware.authorize(statsViewers),
  AppMiddleware.requireMonthQuery,
  AppMiddleware.validateQueryParams,
  EncounterController.getAvgEncounterPerHcpForGivenMonth
);
router.get(
  '/total-referal-rate',
  AuthMiddleware.authorize(statsViewers),
  AppMiddleware.requireMonthQuery,
  AppMiddleware.validateQueryParams,
  EncounterController.getTotalReferalRateForGivenMonth
);
router.get(
  '/avg-cost',
  AuthMiddleware.authorize(statsViewers),
  AppMiddleware.requireMonthQuery,
  AppMiddleware.validateQueryParams,
  EncounterController.getAvgCostForGivenMonth
);
router.get(
  '/nhis-returns',
  AuthMiddleware.authorize(statsViewers),
  AppMiddleware.requireMonthQuery,
  AppMiddleware.validateQueryParams,
  EncounterController.getNhisReturnsForGivenMonth
);
router.get(
  '/top-10-diseases',
  AuthMiddleware.authorize(statsViewers),
  AppMiddleware.requireMonthQuery,
  AppMiddleware.validateQueryParams,
  EncounterController.getTop10DiseaseForGivenMonth
);
router.get(
  '/hcp-list',
  AuthMiddleware.authorize(statsViewers),
  AppMiddleware.requireMonthQuery,
  AppMiddleware.validateQueryParams,
  EncounterController.getHcpListForGivenMonth
);
router.get(
  '/hcp-disease-pattern',
  AuthMiddleware.authorize(statsViewers),
  EncounterMiddleware.validateHcpDiseasePatternQuery,
  EncounterController.getHcpDiseasePatternForGivenMonth
);

export default router;
