const bcrypt = require('bcryptjs');
const { MAX_USER_COUNT } = require('../constants/seeders.constants');
const BCRYPT_SALT = Number(process.env.BCRYPT_SALT);

const getSamplePasswords = (samplePassword, count = MAX_USER_COUNT) => {
  const sampleValue = bcrypt.hashSync(samplePassword, BCRYPT_SALT);
  const samplePasswords = [];
  for (let i = 0; i < count; i++) {
    samplePasswords.push({
      userId: i + 1,
      value: sampleValue,
    });
  }
  return samplePasswords;
};

module.exports = { getSamplePasswords };
