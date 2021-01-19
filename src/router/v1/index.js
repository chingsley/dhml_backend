import express from 'express';

import enrollmentRoutes from '../../modules/enrollee/enrollee.routes';
import usersRoutes from '../../modules/user/user.routes';
import authRoutes from '../../modules/auth/auth.routes';
import rolesRoutes from '../../modules/role/role.routes';

const router = express.Router();

router.use('/users', usersRoutes);
router.use('/auth', authRoutes);
router.use('/enrollees', enrollmentRoutes);
router.use('/roles', rolesRoutes);

export default router;
