/* eslint-disable no-unused-vars */
'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn(
          'ReferalCodes',
          'claimsDeclineDate',
          {
            type: Sequelize.DATE,
          },
          { transaction: t }
        ),
        queryInterface.addColumn(
          'ReferalCodes',
          'claimsDeclineById',
          {
            type: Sequelize.INTEGER,
            references: {
              model: 'Users',
              key: 'id',
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
          },
          { transaction: t }
        ),
        queryInterface.addColumn(
          'ReferalCodes',
          'claimsDeclineReason',
          {
            type: Sequelize.TEXT,
          },
          { transaction: t }
        ),
      ]);
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('ReferalCodes', 'claimsDeclineDate', {
          transaction: t,
        }),
        queryInterface.removeColumn('ReferalCodes', 'claimsDeclineById', {
          transaction: t,
        }),
        queryInterface.removeColumn('ReferalCodes', 'claimsDeclineReason', {
          transaction: t,
        }),
      ]);
    });
  },
};
