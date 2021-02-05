require('dotenv').config();
const { log } = require('./utils/logger');
const db = require('./database/models');
import server from './server';

const PORT = process.env.PORT || 3000;
const dbconnection = db.sequelize;

dbconnection
  .authenticate()
  .then(async () => {
    log('connection to database successful');
    server.server.listen(PORT, function () {
      const { address, port } = this.address();
      const url = `http://${address === '::' ? 'localhost' : address}:${port}`;
      log('server started on: ', url);
    });
  })
  .catch((e) => {
    log(e);
    // throw e.message;
  });
