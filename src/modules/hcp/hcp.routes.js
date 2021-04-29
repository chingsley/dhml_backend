import express from 'express';
import roles, { HOD_ACCOUNT } from '../../shared/constants/roles.constants';
import { HEADERS_OR_QUERY } from '../../shared/constants/strings.constants';
import AppMiddleware from '../app/app.middleware';
import AuthMiddleware from '../auth/auth.middleware';
import HcpController from '../hcp/hcp.controller';
import HcpMiddleware from './hcp.middleware';

const {
  SUPERADMIN,
  ADMIN,
  VERIFIER,
  ENROLMENT_OFFICER,
  HCP,
  ACCOUNT_OFFICER,
  DEPT_USER,
} = roles;

const HOD_AND_HIGHER_ROLES = [
  roles.MD,
  roles.SUPERADMIN,
  roles.ADMIN,
  roles.HOD_AUDIT,
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
    ACCOUNT_OFFICER,
    HCP,
  ]),
  HcpController.getManifest
);
router.get(
  '/capitation',
  HcpMiddleware.validateQuery,
  AuthMiddleware.authorize([...HOD_AND_HIGHER_ROLES, ACCOUNT_OFFICER]),
  HcpController.getCapitation
);
router.get(
  '/print_capitation',
  AuthMiddleware.authorize([...HOD_AND_HIGHER_ROLES, ACCOUNT_OFFICER]),
  HcpController.printCapitationSummary
);
router.get(
  '/:hcpId/verified_enrollees',
  AuthMiddleware.authorize([
    ...HOD_AND_HIGHER_ROLES,
    ENROLMENT_OFFICER,
    ACCOUNT_OFFICER,
    VERIFIER,
    DEPT_USER,
    HCP,
  ]),
  HcpMiddleware.validateQuery,
  HcpController.getVerifiedHcpEnrollees
);
router.get(
  '/:hcpId/download_manifest',
  AuthMiddleware.authorize(
    [...HOD_AND_HIGHER_ROLES, ACCOUNT_OFFICER, ENROLMENT_OFFICER],
    {
      tokenLocation: HEADERS_OR_QUERY,
    }
  ),
  HcpController.downloadHcpManifest
);
router.patch(
  '/status',
  AuthMiddleware.authorize([SUPERADMIN]),
  HcpMiddleware.validateStatusUpdate,
  HcpController.changeHcpStatus
);
// add restriction for editing account information
router.patch(
  '/:hcpId',
  AuthMiddleware.authorize([SUPERADMIN, ADMIN, HOD_ACCOUNT, ACCOUNT_OFFICER]),
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
router.get(
  '/dropdown',
  AuthMiddleware.authorize(),
  HcpController.getHcpDropDownList
);

export default router;
