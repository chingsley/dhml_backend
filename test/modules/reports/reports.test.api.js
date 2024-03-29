import supertest from 'supertest';

import server from '../../../src/server';
import AppApi from '../app/app.test.api';

server.server.timeout = 0;
const app = supertest(server.server);

class ReportsApi extends AppApi {
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

  static auditMonthlyCapSum(summaryId, payload, token) {
    return app
      .patch(`/api/v1/reports/capitation/${summaryId}/audit`)
      .set('authorization', token)
      .send(payload);
  }

  static payMonthlyCapSum(summaryId, token) {
    return app
      .patch(`/api/v1/reports/capitation/${summaryId}/pay/`)
      .set('authorization', token);
  }
}

export default ReportsApi;
