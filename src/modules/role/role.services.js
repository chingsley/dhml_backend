import db from '../../database/models';
import AppService from '../app/app.service';

export default class RoleService extends AppService {
  constructor({ body, files, query, params }) {
    super({ body, files, query, params });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
  }

  fetchAllRoles() {
    return db.Role.findAndCountAll({
      where: { ...this.filterBy(['title']) },
      attributes: ['id', 'title'],
      ...this.paginate(),
    });
  }
}
