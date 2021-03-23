import supertest from 'supertest';

import server from '../../../src/server';
import TestService from '../app/app.test.service';

const app = supertest(server.server);

class ReportsApi extends TestService {
  static getMonthlyCapSum(query = '', token) {
    return app
      .get(`/api/v1/reports/capitation?${query}`)
      .set('authorization', token);
  }

  static approveMonthlyCapSum(summaryId, payload, token) {
    return app
      .patch(`/api/v1/reports/capitation/${summaryId}/approval`)
      .set('authorization', token)
      .send(payload);
  }
}

export default ReportsApi;
