const { roles } = require('../constants');

const sampleRoles = Object.values(roles).map((title) => ({ title }));

module.exports = sampleRoles;
