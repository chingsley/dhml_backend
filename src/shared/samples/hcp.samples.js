const excelToJson = require('convert-excel-to-json');

function getSampleHCPs(count) {
  const { Sheet1: healthCareProviders } = excelToJson({
    sourceFile: 'DHML_HCP_List_2.xlsx',
    header: {
      rows: 1, // no. of rows to skip (skip the headers)
    },
    columnToKey: {
      // A: 'id',
      B: 'code',
      C: 'name',
      D: 'category',
      E: 'state',
    },
  });

  return count
    ? healthCareProviders.slice(0, count)
    : healthCareProviders.slice();
}

module.exports = getSampleHCPs;
