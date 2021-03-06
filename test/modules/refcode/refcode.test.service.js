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
}

export default _RefcodeService;
