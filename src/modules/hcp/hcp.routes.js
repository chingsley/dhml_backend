import express from 'express';
import AuthMiddleware from '../auth/auth.middleware';
import HcpController from '../hcp/hcp.controller';
import HcpMiddleware from './hcp.middleware';

const router = express.Router();

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

export default router;
