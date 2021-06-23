import db from '../../database/models';
import AppService from '../app/app.service';

export default class SpecialistService extends AppService {
  constructor({ body, query, params }) {
    super({ body, query, params });
    this.body = body;
    this.query = query;
    this.params = params;
  }

  getAllSpecialistsSVC() {
    return db.Specialty.findAndCountAll({
      where: {
        ...this.filterBy(['name']),
      },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      ...this.paginate(),
    });
  }
}
