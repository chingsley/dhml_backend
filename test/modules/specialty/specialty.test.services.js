import moment from 'moment';
import db from '../../../src/database/models';
import sampleSpecialities from '../../../src/shared/samples/specialties.sample';
import TestService from '../app/app.test.service';

export const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
export const today = moment().format('YYYY-MM-DD');
export const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

class _SpecialityService extends TestService {
  static async seedOne(speciality = this.getSamples(1)[0]) {
    const [result] = await db.Specialty.upsert(speciality, {
      returning: true,
    });
    return result;
  }

  static getSamples(count = sampleSpecialities.length) {
    return sampleSpecialities.slice(0, count);
  }

  static seedBulk(specialities) {
    return Promise.all(specialities.map((sp) => db.Specialty.create(sp)));
  }

  static findOneWhere(condition) {
    return db.Specialty.findOne({ where: condition });
  }

  static async deleteSpecialites(specialtyIds) {
    await db.HcpSpecialty.destroy({ where: { specialtyId: specialtyIds } });
    await db.ReferalCode.destroy({ where: { specialtyId: specialtyIds } });
    await db.Specialty.destroy({ where: { id: specialtyIds } });
  }

  static hcpBulkInsert(hcpList) {
    return this.handleHcpBulkInsert(hcpList);
  }

}

export default _SpecialityService;
