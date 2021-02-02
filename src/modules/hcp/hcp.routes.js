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
  AuthMiddleware.authorize(),
  HcpMiddleware.validateQuery,
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
  HcpMiddleware.validateQuery,
  HcpController.getVerifiedHcpEnrollees
);
router.patch(
  '/status',
  AuthMiddleware.authorize([SUPERADMIN]),
  HcpMiddleware.validateStatusUpdate,
  HcpController.setHcpStatus
);
router.patch(
  '/:hcpId',
  AuthMiddleware.authorize([SUPERADMIN]),
  AppMiddleware.validateIdParams,
  HcpMiddleware.validateHcpUpdate,
  HcpController.updateHcp
);
router.delete(
  '/:hcpId',
  AuthMiddleware.authorize([SUPERADMIN]),
  AppMiddleware.validateIdParams,
  HcpController.deleteHcp
);

export default router;
