import supertest from 'supertest';
import moment from 'moment';

import Cypher from '../../../src/utils/Cypher';
import server from '../../../src/server';

const { AES_KEY, IV_KEY } = process.env;
const cypher = new Cypher(AES_KEY, IV_KEY);

export const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
export const today = moment().format('YYYY-MM-DD');
export const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

const app = supertest(server.server);

class AuthApi {
  static async login(payload) {
    return app.post('/api/v1/auth/login').send(cypher.formatRequest(payload));
  }
}

export default AuthApi;
