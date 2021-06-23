import supertest from 'supertest';

import server from '../../../src/server';
import AppApi from '../app/app.test.api';

server.server.timeout = 0;
const app = supertest(server.server);

class AccountsApi extends AppApi {
  static getApprovedMonthSpecificCapitation(date, token) {
    return app
      .get(`/api/v1/accounts/capitation?date=${date}`)
      .set('authorization', token);
  }
}

export default AccountsApi;
