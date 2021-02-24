import moment from 'moment';
import getSampleHCPs from '../../../src/shared/samples/hcp.samples';
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

  static async seedHcps({ numPrimary = 0, numSecondary = 0 }) {
    if (numPrimary + numSecondary < 1) {
      return { primaryHcps: [], secondaryHcps: [] };
    }
    const sampleHcps = getSampleHCPs(numPrimary + numSecondary);
    const hcps = await this.bulkInsert([
      ...sampleHcps.slice(0, numPrimary).map((hcp) => ({
        ...hcp,
        category: 'primary',
        code: hcp.code.replace(/\/S/i, '/P'),
      })),
      ...sampleHcps.slice(numPrimary).map((hcp) => ({
        ...hcp,
        category: 'secondary',
        code: hcp.code.replace(/\/P/i, '/S'),
      })),
    ]);
    const primaryHcps = hcps.filter((hcp) => hcp.category.match(/primary/i));
    const secondaryHcps = hcps.filter((hcp) =>
      hcp.category.match(/secondary/i)
    );
    return { primaryHcps, secondaryHcps };
  }
}

export default _HcpService;
