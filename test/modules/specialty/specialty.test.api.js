import supertest from 'supertest';
import server from '../../../src/server';
import TestService from '../app/app.test.service';

const app = supertest(server.server);

class SpecialtyApi extends TestService {
  static async getAllSpecialties(query, token) {
    return await app.get(`/api/v1/specialties?${query}`).set('authorization', token);
  }
}

export default SpecialtyApi;
