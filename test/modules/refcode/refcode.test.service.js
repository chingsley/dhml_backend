import db from '../../../src/database/models';

import TestService from '../app/app.test.service';

class _RefcodeService extends TestService {
  static seedBulk(refcodes) {
    return db.ReferalCode.bulkCreate(refcodes);
  }
}

export default _RefcodeService;
