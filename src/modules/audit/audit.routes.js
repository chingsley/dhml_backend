import express from 'express';

import AuthMiddleware from '../auth/auth.middleware';
import AuditLogController from './audit.controller';
import AuditLogMiddleware from './audit.middleware';
import { MD, SA, SUPERADMIN } from '../../shared/constants/roles.constants';

const router = express.Router();

router.get(
  '/',
  AuthMiddleware.authorize([MD, SA, SUPERADMIN]),
  AuditLogMiddleware.validateAuditLogQuery,
  AuditLogController.getAuditLogs
);

export default router;
