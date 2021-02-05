const excelToJson = require('convert-excel-to-json');
const faker = require('faker');
import { getRandomInt } from '../../utils/helpers';
import { banks } from '../constants/lists.constants';

function convertExcelToJson() {
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
  return healthCareProviders;
}
function getSampleHCPs(count) {
  const healthCareProviders = convertExcelToJson();

  const HCPs = healthCareProviders.map((hcp) => ({
    ...hcp,
    address: faker.address.secondaryAddress(),
    email: faker.internet.email(),
    phoneNumber: faker.phone.phoneNumber(),
    alternativePhoneNumber: faker.phone.phoneNumber(),
    bank: faker.random.arrayElement(banks),
    bankAddress: faker.address.secondaryAddress(),
    accountNumber: getRandomInt(9999999999, { min: 1000000000 }),
    accountType: faker.random.arrayElement(['savings', 'current', 'corporate']),
  }));

  return count ? HCPs.slice(0, count) : HCPs.slice();
}

module.exports = getSampleHCPs;
