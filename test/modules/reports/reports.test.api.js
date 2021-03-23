import supertest from 'supertest';

import server from '../../../src/server';
import TestService from '../app/app.test.service';

const app = supertest(server.server);

class ReportsApi extends TestService {
  static async getMonthlyCapSum(query = '', token) {
    return await app
      .get(`/api/v1/reports/capitation?${query}`)
      .set('authorization', token);
  }
}

export default ReportsApi;
