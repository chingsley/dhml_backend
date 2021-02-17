const roles = require('../constants/roles.constants');
const allRoles = Object.values(roles);
const userRoles = allRoles.filter((role) => role !== 'hcp');
const hcpRole = allRoles.find((role) => role === 'hcp');

/**
 * Ensuring that 'hcp' role is the last role
 */
const sampleRoles = [...userRoles, hcpRole].map((value) => ({ title: value }));

module.exports = sampleRoles;
