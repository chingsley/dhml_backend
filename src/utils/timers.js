const moment = require('moment');

const days = {
  setPast: (n) => moment().subtract(n, 'days').format('YYYY-MM-DD'),
  setFuture: (n) => moment().add(n, 'days').format('YYYY-MM-DD'),
  today: moment().format('YYYY-MM-DD'),
};

const t24Hours = new Date(new Date().getTime() + 1000 * 60 * 60 * 24);

module.exports = { days, t24Hours };
