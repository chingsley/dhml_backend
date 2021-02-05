import dotenv from 'dotenv';

dotenv.config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    operatorsAliases: 0,
    logging: 0,
  },
  mysql_development: {
    username: process.env.MYSQL_DB_USERNAME,
    password: process.env.MYSQL_DB_PASSWORD,
    database: process.env.MYSQL_DB_NAME,
    host: process.env.MYSQL_DB_HOST,
    dialect: process.env.MYSQL_DB_DIALECT,
    operatorsAliases: 0,
    logging: 0,
  },
  test: {
    username: process.env.TEST_DB_USERNAME,
    password: process.env.TEST_DB_PASSWORD,
    database: process.env.TEST_DB_NAME,
    host: process.env.TEST_DB_HOST,
    dialect: process.env.TEST_DB_DIALECT,
    operatorsAliases: 0,
    logging: 0,
  },
  staging: {
    username: process.env.STAGING_DB_USERNAME,
    password: process.env.STAGING_DB_PASSWORD,
    database: process.env.STAGING_DB_NAME,
    host: process.env.STAGING_DB_HOST,
    dialect: process.env.STAGING_DB_DIALECT,
    operatorsAliases: 0,
    logging: 0,
  },
  // staging: {
  //   ...(process.env.DATABASE_URL
  //     ? {
  //         use_env_variable: 'DATABASE_URL',
  //       }
  //     : {
  //         username: process.env.STAGING_DB_USERNAME,
  //         password: process.env.STAGING_DB_PASSWORD,
  //         database: process.env.STAGING_DB_NAME,
  //         host: process.env.STAGING_DB_HOST,
  //         dialect: process.env.STAGING_DB_DIALECT,
  //         operatorsAliases: 0,
  //         logging: 0,
  //       }),
  // },
  production: {
    username: process.env.PRODUCTION_DB_USERNAME,
    password: process.env.PRODUCTION_DB_PASSWORD,
    database: process.env.PRODUCTION_DB_NAME,
    host: process.env.PRODUCTION_DB_HOST,
    dialect: process.env.PRODUCTION_DB_DIALECT,
    operatorsAliases: 0,
    logging: 0,
  },
};
