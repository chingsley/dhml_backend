require('dotenv').config();

const db = require('./database/models');
import server from './server';

const { log } = console;
const PORT = process.env.PORT || 3000;
const dbconnection = db.sequelize;

dbconnection
  .authenticate()
  .then(async () => {
    log('connection to database successful');
    server.server.listen(PORT, () => {
      const { log } = console;
      log(`*** server running on port ${PORT} ***`);
    });
  })
  .catch((e) => {
    throw e.message;
  });
