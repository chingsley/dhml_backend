const bcrypt = require('bcryptjs');
const { MAX_STAFF_COUNT } = require('../config');
const BCRYPT_SALT = Number(process.env.BCRYPT_SALT);
const sampleValue = bcrypt.hashSync('Testing*123', BCRYPT_SALT);

const getSamplePasswords = (count = MAX_STAFF_COUNT) => {
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
