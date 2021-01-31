import express from 'express';
import { SUPERADMIN } from '../../shared/constants/roles.constants';
import AppMiddleware from '../app/app.middleware';
import AuthMiddleware from '../auth/auth.middleware';
import HcpController from '../hcp/hcp.controller';
import HcpMiddleware from './hcp.middleware';

const router = express.Router();

router.post(
  '/',
  AuthMiddleware.authorize([SUPERADMIN]),
  HcpMiddleware.validateNewHcp,
  HcpController.addNewHcp
);
router.get(
  '/',
  HcpMiddleware.validateQuery,
  AuthMiddleware.authorize(),
  HcpController.getAllHcp
);
router.get(
  '/manifest',
  HcpMiddleware.validateQuery,
  AuthMiddleware.authorize(),
  HcpController.getManifest
);
router.get(
  '/capitation',
  HcpMiddleware.validateQuery,
  AuthMiddleware.authorize(),
  HcpController.getCapitation
);
router.get(
  '/:hcpId/verified_enrollees',
  AuthMiddleware.authorize(),
  HcpController.getVerifiedHcpEnrollees
);
router.patch(
  '/status',
  AuthMiddleware.authorize([SUPERADMIN]),
  HcpMiddleware.validateStatusUpdate,
  HcpController.setHcpStatus
);
router.delete(
  '/:hcpId',
  AuthMiddleware.authorize([SUPERADMIN]),
  AppMiddleware.validateIdParams,
  HcpController.deleteHcp
);

export default router;
