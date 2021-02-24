import moment from 'moment';
import { Op } from 'sequelize';
import db from '../../../src/database/models';
import TestService from '../app/app.test.service';

export const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
export const today = moment().format('YYYY-MM-DD');
export const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

class EnrolleeTest extends TestService {
  static async addDependantsToPrincipal(dependants, principal) {
    return await db.Enrollee.bulkCreate(
      dependants.map((dependant) => ({
        ...dependant,
        principalId: principal.id,
        scheme: principal.scheme,
        hcpId: principal.hcpId,
      }))
    );
  }
  static getPrincipalDependants(principalId) {
    return db.Enrollee.findAll({ where: { principalId } });
  }

  static async getEnrolleesByIdArray(idArr) {
    return db.Enrollee.findAll({ where: { id: { [Op.in]: idArr } } });
  }

  static findById(id) {
    return db.Enrollee.findOne({
      where: { id },
      include: { model: db.Enrollee, as: 'dependants' },
    });
  }
}

export default EnrolleeTest;
