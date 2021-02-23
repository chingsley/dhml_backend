import db from '../../../src/database/models';

import TestService from '../app/app.test.service';

class _RefcodeService extends TestService {
  static HCP = db.HealthCareProvider;

  static async countActive() {
    return this.HCP.count({ where: { status: 'active' } });
  }
}

export default _RefcodeService;
