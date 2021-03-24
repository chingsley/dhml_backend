import supertest from 'supertest';

import server from '../../../src/server';
import TestService from '../app/app.test.service';

server.server.timeout = 0;
const app = supertest(server.server);

class StatsApi extends TestService {
  static getGeneralStats(token) {
    return app.get('/api/v1/stats').set('authorization', token);
  }
}

export default StatsApi;
