const faker = require('faker');
import { days, months } from '../../utils/timers';
const { getRandomInt } = require('../../utils/helpers');

const getSampleVoucher = (gmcId) => ({
  gmcId,
  department: faker.commerce.department(),
  acCode: `${getRandomInt(9999999999, { min: 1000000000 })}`,
  pvNo: `${getRandomInt(9999999999, { min: 1000000000 })}`,
  payee: faker.name.lastName(),
  amountInWords: 'amount in words (to be specified by user',
  serviceDate: months.setPast(2),
  serviceDescription: faker.lorem.words(),
  preparedBy: faker.name.lastName(),
  preparerDesignation: 'Account Officer',
  datePrepared: days.today,
  authorizedBy: faker.name.lastName(),
  authorizerDesignation: 'Accountant',
  dateAuthorized: days.today,
  address: `${faker.address.zipCode()} ${faker.address.city()},  ${faker.address.state()}, ${faker.address.country()}`,
});

export default getSampleVoucher;
