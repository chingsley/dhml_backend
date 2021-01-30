// import supertest from 'supertest';
import moment from 'moment';
import db from '../../../src/database/models';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';

// import server from '../../../src/server';
// import TestService from '../app/app.test.service';

export const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
export const today = moment().format('YYYY-MM-DD');
export const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

// const app = supertest(server.server);

class Staff {
  constructor(sampleStaffs) {
    this.sampleStaffs = sampleStaffs;
  }

  static async seedOne(staff = this.sampleStaffs[0]) {
    const [result] = await db.Staff.upsert(staff, { returning: true });
    return result;
  }

  static get sampleStaffs() {
    const { sampleStaffs } = getSampleStaffs(5);
    return sampleStaffs;
  }
}

export default Staff;
