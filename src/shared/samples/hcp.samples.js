const excelToJson = require('convert-excel-to-json');

function getSampleHCPs(count) {
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

  return count
    ? healthCareProviders.slice(0, count)
    : healthCareProviders.slice();
}

module.exports = getSampleHCPs;
