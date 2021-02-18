import db from '../../../src/database/models';
import ROLES from '../../../src/shared/constants/roles.constants';

import TestService from '../app/app.test.service';

class _RoleService extends TestService {
  static findByTitle(roleTitle) {
    return db.Role.findOne({ where: { title: roleTitle } });
  }

  static seedBulk(roles) {
    return db.Role.bulkCreate(roles);
  }

  static seedAllRoles() {
    return this.seedBulk(
      Object.values(ROLES).map((value) => ({ title: value }))
    );
  }
}

export default _RoleService;
