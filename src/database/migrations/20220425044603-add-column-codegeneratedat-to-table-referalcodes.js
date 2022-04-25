'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn(
          'ReferalCodes',
          'codeGeneratedAt',
          {
            type: Sequelize.DATE,
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
        queryInterface.removeColumn('ReferalCodes', 'codeGeneratedAt', {
          transaction: t,
        }),
      ]);
    });
  },
};
