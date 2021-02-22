/* eslint-disable no-unused-vars */
'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('Users', 'email', {
          transaction: t,
        }),
      ]);
    });
  },

  down: (queryInterface, Sequelize) => {
    return new Promise((res, rej) => {
      return res();
    });
  },
};
