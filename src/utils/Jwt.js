import jwt from 'jsonwebtoken';
const { JWT_SECRET } = process.env;
import moment from 'moment';
import { ACCESS_DENIED, AUTH002 } from '../shared/constants/errors.constants';
import { throwError } from '../shared/helpers';

class Jwt {
  static generateToken(user) {
    const payload = {
      subject: user.id,
      role: user.role?.title || 'dept user',
      timestamp: moment().format('YYYYMMDDHHmmss'),
    };
    const options = { expiresIn: '1d' };
    return jwt.sign(payload, JWT_SECRET, options);
  }

  static decode(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      throwError({
        status: 401,
        error: ACCESS_DENIED,
        errorCode: AUTH002,
      });
    }
  }
}

export default Jwt;
