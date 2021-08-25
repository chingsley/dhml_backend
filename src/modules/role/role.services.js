import db from '../../database/models';
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
      where: { ...this.filterBy(['title'], { modelName: 'Role' }) },
      attributes: ['id', 'title'],
      ...this.paginate(),
    });
  }

  findAllWhere(condition) {
    return db.Role.findAndCountAll({
      where: {
        ...condition,
        ...this.filterBy(['title'], { modelName: 'Role' }),
      },
      ...this.paginate(),
    });
  }
}
