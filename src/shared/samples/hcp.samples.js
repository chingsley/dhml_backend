const excelToJson = require('convert-excel-to-json');
const faker = require('faker');
import { getRandomInt } from '../../utils/helpers';
import { banks } from '../constants/lists.constants';
require('dotenv').config();

const { NODE_ENV } = process.env;

function convertExcelToJson() {
  const { Sheet1: healthCareProviders } = excelToJson({
    sourceFile: 'hcp_by_arm_of_service.xlsx',
    header: {
      rows: 1, // no. of rows to skip (skip the headers)
    },
    columnToKey: {
      A: 'armOfService',
      // B: 'id',
      C: 'code',
      D: 'name',
      E: 'category',
      F: 'state',
      G: 'status',
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
    status: NODE_ENV === 'test' ? undefined : hcp.status,
  }));

  return count ? HCPs.slice(0, count) : HCPs.slice();
}

module.exports = getSampleHCPs;
