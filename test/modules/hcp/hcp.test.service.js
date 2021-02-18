import moment from 'moment';
// import { Op } from 'sequelize';
import db from '../../../src/database/models';
import { HCP } from '../../../src/shared/constants/roles.constants';

import TestService from '../app/app.test.service';

export const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
export const today = moment().format('YYYY-MM-DD');
export const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

class _HcpService extends TestService {
  static HCP = db.HealthCareProvider;

  static findById(id) {
    return db.HealthCareProvider.findOne({ where: { id } });
  }
  static findByIdArr(idArr) {
    return db.HealthCareProvider.findAll({ where: { id: idArr } });
  }

  static async bulkInsert(hcpList) {
    const hcpRole = await this.createRole(HCP);
    return this.HCP.bulkCreate(
      hcpList.map((hcp) => ({ ...hcp, roleId: hcpRole.id }))
    );
  }

  static async countActive() {
    return this.HCP.count({ where: { status: 'active' } });
  }
}

export default _HcpService;
