import express from 'express';
import { MD } from '../../shared/constants/roles.constants';
import AuthMiddleware from '../auth/auth.middleware';
import AuditLogController from './audit.controller';
import AuditLogMiddleware from './audit.middleware';

const router = express.Router();

router.get(
  '/',
  AuthMiddleware.authorize([MD]),
  AuditLogMiddleware.validateAuditLogQuery,
  AuditLogController.getAuditLogs
);

export default router;
