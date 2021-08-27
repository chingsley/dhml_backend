import { Op } from 'sequelize';
import db from '../../database/models';
import rolesConstants from '../../shared/constants/roles.constants';
import AppService from '../app/app.service';

export default class RoleService extends AppService {
  constructor({ body, files, query, params, user: operator }) {
    super({ body, files, query, params, operator });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
    this.operator = operator;
  }

  fetchAllRoles() {
    return db.Role.findAndCountAll({
      where: {
        [Op.and]: [
          this.filterBy(['title']),
          this.filterRolesByOperator(this.operator),
        ],
        //,
      },
      attributes: ['id', 'title'],
      ...this.paginate(),
    });
  }

  filterRolesByOperator(operator) {
    const operatorRole = operator.role.title;
    const { MD, SUPERADMIN, BASIC } = rolesConstants;
    if (operatorRole === MD) {
      return {};
    }
    if (operatorRole === SUPERADMIN) {
      return { title: { [Op.notIn]: [MD] } };
    }
    return { title: BASIC };
  }
}
