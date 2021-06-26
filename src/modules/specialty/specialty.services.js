/* eslint-disable indent */
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
    const { hcpId } = this.query;
    return db.Specialty.findAndCountAll({
      where: {
        ...this.filterBy(['name']),
      },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      ...this.paginate(),
      ...this.filterByHcpId(hcpId),
    });
  }
  filterByHcpId(hcpId) {
    return hcpId
      ? {
          include: {
            model: db.HcpSpecialty,
            where: { hcpId },
            attributes: [],
          },
        }
      : {};
  }
}
