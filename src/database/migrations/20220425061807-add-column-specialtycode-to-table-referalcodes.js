'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn(
          'ReferalCodes',
          'specialtyCode', // at the time of refcode generation
          {
            type: Sequelize.TEXT,
          },
          { transaction: t }
        ),
      ]);
    });
  },
  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('ReferalCodes', 'specialtyCode', {
          transaction: t,
        }),
      ]);
    });
  },
};
