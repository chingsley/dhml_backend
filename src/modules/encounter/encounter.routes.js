import express from 'express';
import AppMiddleware from '../app/app.middleware';
import AuthMiddleware from '../auth/auth.middleware';
import EncounterMiddleware from './encounter.middleware';
import EncounterController from './encounter.controller';
import {
  SA,
  HCP,
  MD,
  SUPERADMIN,
  HOD_MEDICAL,
  HOD_PR_AND_M,
  HOD_VHS,
  HOD_ACCOUNT,
  ACCOUNT_OFFICER,
} from '../../shared/constants/roles.constants';

const STATS_VIEWERS = [
  MD,
  SUPERADMIN,
  HOD_MEDICAL,
  HOD_PR_AND_M,
  HOD_VHS,
  HOD_ACCOUNT,
  ACCOUNT_OFFICER,
  SA,
];

const router = express.Router();

router.post(
  '/',
  AuthMiddleware.authorize([HCP]),
  EncounterMiddleware.validateEncounter,
  EncounterController.recordEncounterCTRL
);

router.get(
  '/total',
  AuthMiddleware.authorize(STATS_VIEWERS),
  AppMiddleware.requireMonthQuery,
  AppMiddleware.validateQueryParams,
  EncounterController.getTotalEncounterForGivenMonth
);
router.get(
  '/avg-encounter-per-hcp',
  AuthMiddleware.authorize(STATS_VIEWERS),
  AppMiddleware.requireMonthQuery,
  AppMiddleware.validateQueryParams,
  EncounterController.getAvgEncounterPerHcpForGivenMonth
);
router.get(
  '/total-referal-rate',
  AuthMiddleware.authorize(STATS_VIEWERS),
  AppMiddleware.requireMonthQuery,
  AppMiddleware.validateQueryParams,
  EncounterController.getTotalReferalRateForGivenMonth
);
router.get(
  '/avg-cost',
  AuthMiddleware.authorize(STATS_VIEWERS),
  AppMiddleware.requireMonthQuery,
  AppMiddleware.validateQueryParams,
  EncounterController.getAvgCostForGivenMonth
);
router.get(
  '/nhis-returns',
  AuthMiddleware.authorize(STATS_VIEWERS),
  AppMiddleware.requireMonthQuery,
  AppMiddleware.validateQueryParams,
  EncounterController.getNhisReturnsForGivenMonth
);
router.get(
  '/top-10-diseases',
  AuthMiddleware.authorize(STATS_VIEWERS),
  AppMiddleware.requireMonthQuery,
  AppMiddleware.validateQueryParams,
  EncounterController.getTop10DiseaseForGivenMonth
);
router.get(
  '/hcp-list',
  AuthMiddleware.authorize(STATS_VIEWERS),
  AppMiddleware.requireMonthQuery,
  AppMiddleware.validateQueryParams,
  EncounterController.getHcpListForGivenMonth
);
router.get(
  '/hcp-disease-pattern',
  AuthMiddleware.authorize(STATS_VIEWERS),
  EncounterMiddleware.validateHcpDiseasePatternQuery,
  EncounterController.getHcpDiseasePatternForGivenMonth
);
router.get(
  '/hcp-encounter-report',
  AuthMiddleware.authorize(STATS_VIEWERS),
  EncounterMiddleware.validateHcpDiseasePatternQuery,
  EncounterController.getHcpEncounterReportForGivenMonth
);

export default router;
