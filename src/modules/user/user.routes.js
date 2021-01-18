import express from 'express';
import UserController from './user.controller';
import UserMiddleware from './user.middleware';

const router = express.Router();

router.post('/', UserMiddleware.validateNewUser, UserController.registerUser);

export default router;
