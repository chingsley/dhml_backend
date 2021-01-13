import express from 'express';

import rolesRoutes from './rolesRoutes';
import usersRoutes from './usersRoutes';
import authRoutes from './authRoutes';
// import usersRoutes from '../../user/user.routes';
// import rolesRoutes from '../../role/role.routes';
// import authRoutes from '../../auth/auth.routes';
import enrollmentRoutes from '../../enrollee/enrollee.routes';

const router = express.Router();

router.use('/roles', rolesRoutes);
router.use('/users', usersRoutes);
router.use('/auth', authRoutes);
router.use('/enrollees', enrollmentRoutes);

export default router;
