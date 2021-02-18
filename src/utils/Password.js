const bcrypt = require('bcryptjs');
const BCRYPT_SALT = Number(process.env.BCRYPT_SALT);

class Password {
  static hash(value) {
    return bcrypt.hashSync(value, BCRYPT_SALT);
  }
}

export default Password;
