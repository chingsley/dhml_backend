import db from '../../../src/database/models';

class _AuthService {
  static getPasswordDetails(idType, id) {
    return db.Password.findOne({ where: { [idType]: id } });
  }
}

export default _AuthService;
