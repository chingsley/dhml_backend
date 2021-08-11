import { DISEASE_PATTERN_RANGES } from '../../shared/constants/lists.constants';

const _ = require('lodash');

const encounterHelpers = {
  async formatHcpDiseasePatterns(rows) {
    // merge same-disease records into one...
    // data object with seperate count for each range
    const groupedByDisease = rows.reduce((acc, row) => {
      const disease = row.disease;
      const obj = {
        disease,
        [row.ageGroup]: Number(row.count),
      };
      if (!acc[disease]) {
        acc[disease] = obj;
      } else {
        _.merge(acc[disease], obj);
      }
      return acc;
    }, {});

    // convert data object into array of objects
    const finalRows = [];
    for (const key in groupedByDisease) {
      finalRows.push(groupedByDisease[key]);
    }

    // set null ranges to zero and compute total for each disease
    finalRows.map((row) => {
      for (const range of DISEASE_PATTERN_RANGES) {
        if (!row[range]) {
          row[range] = 0;
        }
      }
      row.total = Object.keys(row).reduce((acc, key) => {
        if (key.toLowerCase() !== 'disease') {
          acc += Number(row[key]);
        }
        return acc;
      }, 0);
    });
    return finalRows;
  },

  async getCodeSerialNo() {},
};

export default encounterHelpers;
