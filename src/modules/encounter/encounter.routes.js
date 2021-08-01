import express from 'express';
import roles from '../../shared/constants/roles.constants';
// import AppMiddleware from '../app/app.middleware';
import AuthMiddleware from '../auth/auth.middleware';
import EncounterMiddleware from './encounter.middleware';
import EncounterController from './encounter.controller';

const { HCP } = roles;

const router = express.Router();

router.post(
  '/',
  AuthMiddleware.authorize([HCP]),
  EncounterMiddleware.validateEncounter,
  EncounterController.recordEncounterCTRL
);

export default router;
