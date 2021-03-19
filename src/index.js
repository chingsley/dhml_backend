require('dotenv').config();
const { log, color } = require('./utils/logger');
const db = require('./database/models');
import server from './server';

const PORT = process.env.PORT || 3000;
const dbconnection = db.sequelize;
const env = process.env.NODE_ENV || 'development';

dbconnection
  .authenticate()
  .then(async () => {
    log('connected to', color.yellow, env, color.blue, 'database');
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
