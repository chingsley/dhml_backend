/* eslint-disable no-unused-vars */
'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn(
          'Claims',
          'originalClaimId',
          {
            type: Sequelize.UUID,
            allowNull: true,
          },
          { transaction: t }
        ),
      ]);
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('Claims', 'originalClaimId', {
          transaction: t,
        }),
      ]);
    });
  },
};
