import express from 'express';
import AuthMiddleware from '../auth/auth.middleware';
import SpecialistController from './specialty.controller';

const router = express.Router();

router.get(
  '/',
  AuthMiddleware.authorize(),
  SpecialistController.getAllSpecialists
);

export default router;
