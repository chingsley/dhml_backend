/* eslint-disable no-unused-vars */
'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn(
          'HealthCareProviders',
          'armOfService',
          {
            type: Sequelize.STRING,
          },
          { transaction: t }
        ),
        queryInterface.addColumn(
          'HealthCareProviders',
          'geopoliticalZone',
          {
            type: Sequelize.STRING,
          },
          { transaction: t }
        ),
      ]);
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('HealthCareProviders', 'armOfService', {
          transaction: t,
        }),
        queryInterface.removeColumn('HealthCareProviders', 'geopoliticalZone', {
          transaction: t,
        }),
      ]);
    });
  },
};
