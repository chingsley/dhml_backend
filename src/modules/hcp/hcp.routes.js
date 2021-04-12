import express from 'express';
import roles, { DEPT_USER } from '../../shared/constants/roles.constants';
import { HEADERS_OR_QUERY } from '../../shared/constants/strings.constants';
import AppMiddleware from '../app/app.middleware';
import AuthMiddleware from '../auth/auth.middleware';
import HcpController from '../hcp/hcp.controller';
import HcpMiddleware from './hcp.middleware';

const { SUPERADMIN, ADMIN, VERIFIER, ENROLMENT_OFFICER, HCP } = roles;

const HOD_AND_HIGHER_ROLES = [
  roles.SUPERADMIN,
  roles.ADMIN,
  roles.HOD_ACCOUNT,
  roles.HOD_ADMIN,
  roles.HOD_MEDICAL,
  roles.HOD_STORES,
  roles.HOD_VHS,
];

const router = express.Router();

router.post(
  '/',
  AuthMiddleware.authorize([SUPERADMIN, ADMIN]),
  HcpMiddleware.validateNewHcp,
  HcpController.addNewHcp
);
router.get(
  '/',
  AuthMiddleware.authorize(),
  HcpMiddleware.validateQuery,
  HcpController.getAllHcp
);
router.get(
  '/manifest',
  HcpMiddleware.validateQuery,
  AuthMiddleware.authorize([
    ...HOD_AND_HIGHER_ROLES,
    ENROLMENT_OFFICER,
    DEPT_USER,
    HCP,
  ]),
  HcpController.getManifest
);
router.get(
  '/capitation',
  HcpMiddleware.validateQuery,
  AuthMiddleware.authorize([...HOD_AND_HIGHER_ROLES]),
  HcpController.getCapitation
);
router.get(
  '/print_capitation',
  AuthMiddleware.authorize([...HOD_AND_HIGHER_ROLES]),
  HcpController.printCapitationSummary
);
router.get(
  '/:hcpId/verified_enrollees',
  AuthMiddleware.authorize([
    ...HOD_AND_HIGHER_ROLES,
    ENROLMENT_OFFICER,
    VERIFIER,
    DEPT_USER,
    HCP,
  ]),
  HcpMiddleware.validateQuery,
  HcpController.getVerifiedHcpEnrollees
);
router.get(
  '/:hcpId/download_manifest',
  AuthMiddleware.authorize([...HOD_AND_HIGHER_ROLES, ENROLMENT_OFFICER], {
    tokenLocation: HEADERS_OR_QUERY,
  }),
  HcpController.downloadHcpManifest
);
router.patch(
  '/status',
  AuthMiddleware.authorize([SUPERADMIN]),
  HcpMiddleware.validateStatusUpdate,
  HcpController.changeHcpStatus
);
router.patch(
  '/:hcpId',
  AuthMiddleware.authorize([SUPERADMIN, ADMIN]),
  AppMiddleware.validateIdParams,
  HcpMiddleware.validateHcpUpdate,
  HcpController.updateHcp
);
router.delete(
  '/:hcpId',
  AuthMiddleware.authorize([SUPERADMIN]),
  AppMiddleware.validateIdParams,
  HcpController.deleteHcp
);

export default router;
