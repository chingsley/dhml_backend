const { default: Password } = require('../../utils/Password');
const { MAX_USER_COUNT } = require('../constants/seeders.constants');

const getSampleUserPasswords = (samplePassword, count = MAX_USER_COUNT) => {
  const samplePasswords = [];
  const sampleValue = Password.hash(samplePassword);
  for (let i = 0; i < count; i++) {
    samplePasswords.push({
      userId: i + 1,
      value: sampleValue,
      isDefaultValue: false,
    });
  }
  return samplePasswords;
};

const getSampleHcpPasswords = (samplePassword, count = 250) => {
  const samplePasswords = [];
  const sampleValue = Password.hash(samplePassword);
  for (let i = 0; i < count; i++) {
    samplePasswords.push({
      hcpId: i + 1,
      value: sampleValue,
      isDefaultValue: false,
    });
  }
  return samplePasswords;
};

module.exports = { getSampleUserPasswords, getSampleHcpPasswords };
