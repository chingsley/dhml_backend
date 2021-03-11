import db from '../../../src/database/models';

import TestService from '../app/app.test.service';

class _RefcodeService extends TestService {
  static seedBulk(refcodes) {
    return db.ReferalCode.bulkCreate(refcodes);
  }
  static bulkUpdate(seededRefcodes, changes) {
    const ids = seededRefcodes.map((refcode) => refcode.id);
    return db.ReferalCode.update(changes, { where: { id: ids } });
  }

  static flag(seededRefcodes) {
    return this.bulkUpdate(seededRefcodes, { isFlagged: true });
  }

  static approve(seededRefcodes) {
    return this.bulkUpdate(seededRefcodes, { isFlagged: false });
  }

  static async reload(seededRefcode) {
    await seededRefcode.reload({
      include: [
        { model: db.Enrollee, as: 'enrollee' },
        { model: db.HealthCareProvider, as: 'destinationHcp' },
      ],
    });
    return seededRefcode;
  }
}

export default _RefcodeService;
