'use strict';

const {
  default: specialties,
} = require('../../shared/samples/specialties.sample');

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Specialties', specialties);
  },

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Specialties', null, {});
  },
};
