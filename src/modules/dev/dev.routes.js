import express from 'express';
import AuthMiddleware from '../auth/auth.middleware';
import DevController from './dev.controller';

const router = express.Router();

router.patch(
  '/dependants',
  AuthMiddleware.authorize(),
  DevController.updateDependant
);

export default router;
