import moment from 'moment';
// import { Op } from 'sequelize';
import db from '../../../src/database/models';

import TestService from '../app/app.test.service';

export const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
export const today = moment().format('YYYY-MM-DD');
export const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

class _HcpService extends TestService {
  static findById(id) {
    return db.HealthCareProvider.findOne({ where: { id } });
  }
  static findByIdArr(idArr) {
    return db.HealthCareProvider.findAll({ where: { id: idArr } });
  }
}

export default _HcpService;
