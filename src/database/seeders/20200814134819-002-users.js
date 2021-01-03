'use strict';

import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const bcrypt = require('bcryptjs');
const password = bcrypt.hashSync(
  'Testing*123',
  Number(process.env.BCRYPT_SALT)
);

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Users', [
      {
        firstName: 'kingsley',
        lastName: 'eneja',
        email: 'eneja.kc@gmail.com',
        username: 'enejakc',
        password,
        roleId: 1,
        image:
          'https://res.cloudinary.com/dmx0a3nqi/image/upload/t_media_lib_thumb/v1571040003/gbart8vc5ervfmccdqlm.png',
        uuid: uuidv4(),
      },
      {
        firstName: 'kelvin',
        lastName: 'esegbona',
        email: 'kesegbona@gmail.com',
        username: 'kesegbona',
        password,
        roleId: 2,
        uuid: uuidv4(),
      },
    ]);
  },

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {});
  },
};
