'use strict';

import dotenv from 'dotenv';
dotenv.config();

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Roles', [
      {
        name: 'superadmin',
      },
      {
        name: 'admin',
      },
      {
        name: 'user',
      },
    ]);
  },

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Roles', null, {});
  },
};
