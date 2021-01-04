'use strict';

const excelToJson = require('convert-excel-to-json');

const { Sheet1: healthCareProviders } = excelToJson({
  sourceFile: 'DHML_HCP_List.xlsx',
  header: {
    rows: 1,
  },
  columnToKey: {
    // A: 'id',
    B: 'code',
    C: 'name',
  },
});
// console.log(Sheet1);

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(
      'HealthCareProviders',
      healthCareProviders
    );
  },

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('HealthCareProviders', null, {});
  },
};
