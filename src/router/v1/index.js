import express from 'express';

import enrollmentRoutes from '../../modules/enrollee/enrollee.routes';
import usersRoutes from '../../modules/user/user.routes';
import authRoutes from '../../modules/auth/auth.routes';
import rolesRoutes from '../../modules/role/role.routes';
import staffRoutes from '../../modules/staff/staff.routes';
import hcpRoutes from '../../modules/hcp/hcp.routes';
import refcodeRoutes from '../../modules/refcode/refcode.routes';
import reportsRoutes from '../../modules/reports/reports.routes';
import statsRoutes from '../../modules/stats/stats.routes';
import accountRoutes from '../../modules/account/account.routes';
import devRoutes from '../../modules/dev/dev.routes';
import specialtyRoutes from '../../modules/specialty/specialty.routes';

const router = express.Router();

router.use('/users', usersRoutes);
router.use('/auth', authRoutes);
router.use('/enrollees', enrollmentRoutes);
router.use('/roles', rolesRoutes);
router.use('/staffs', staffRoutes);
router.use('/hcp', hcpRoutes);
router.use('/refcodes', refcodeRoutes);
router.use('/reports', reportsRoutes);
router.use('/stats', statsRoutes);
router.use('/accounts', accountRoutes);
router.use('/specialties', specialtyRoutes);
router.use('/devs', devRoutes);

export default router;
