import express from 'express';

import enrollmentRoutes from '../../modules/enrollee/enrollee.routes';
import usersRoutes from '../../modules/user/user.routes';
import authRoutes from '../../modules/auth/auth.routes';

const router = express.Router();

router.use('/users', usersRoutes);
router.use('/auth', authRoutes);
router.use('/enrollees', enrollmentRoutes);

export default router;
