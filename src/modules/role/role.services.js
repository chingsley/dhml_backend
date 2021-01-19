import db from '../../database/models';
import AppService from '../app/app.service';

export default class RoleService extends AppService {
  constructor({ body, files, query }) {
    super({ body, files, query });
    this.body = body;
    this.files = files;
    this.query = query;
  }

  fetchAllRoles() {
    return db.Role.findAndCountAll({
      where: { ...this.filterBy(['title']) },
      attributes: ['id', 'title'],
      ...this.paginate(),
    });
  }
}
