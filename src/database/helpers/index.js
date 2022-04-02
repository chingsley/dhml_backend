const { color } = require("../../utils/logger");

module.exports.loggNodeEnvWarning = (msg) => {
  const { log } = console;
  const NODE_ENV = process.env.NODE_ENV || 'development';

  log(color.red, msg, color.resetColor);
  log(
    color.yellow,
    `This error might be due to your NODE_ENV settings.
    Your current NODE_ENV is ${NODE_ENV}.
    If this seed is not for 'development' environment, then
    you are required to set the value in your .env file
    `,
    color.resetColor,
  );
};