import express from 'express';
import EnrolleeController from './enrollee.controller';
import EnrolleeMiddleware from './enrollee.middleware';

const router = express.Router();

router.post(
  '/',
  EnrolleeMiddleware.validateNewEnrollee,
  EnrolleeController.addNewEnrollee
);

export default router;
