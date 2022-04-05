import moment from 'moment';
import db from '../../../src/database/models';
import sampleSpecialities from '../../../src/shared/samples/specialties.sample';
import { _randArr } from '../../../src/utils/helpers';
import TestService from '../app/app.test.service';

export const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
export const today = moment().format('YYYY-MM-DD');
export const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

class HcpSpecialityService extends TestService {
  static getSamples(count = sampleSpecialities.length) {
    return sampleSpecialities.slice(0, count);
  }

  static seedBulk(specialities) {
    return Promise.all(specialities.map((sp) => db.Specialty.create(sp)));
  }

  static async seedRandomHcpSpecialties(seededHcps) {
    const seededSpecialties = await this.seedBulk(this.getSamples());
    const seededSpecialtyIds = seededSpecialties.map(sp => sp.id);
    const hcpSpecialties = seededHcps.reduce((acc, hcp) => {
      const ids = _randArr(seededSpecialtyIds, 4);
      ids.map(id => acc.push({ hcpId: hcp.id, specialtyId: id }));

      return acc;
    }, []);

    return db.HcpSpecialty.bulkCreate(hcpSpecialties);
  }
}

export default HcpSpecialityService;
