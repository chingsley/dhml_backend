const moment = require('moment');

const days = {
  setPast: (n) => moment().subtract(n, 'days').format('YYYY-MM-DD'),
  setFuture: (n) => moment().add(n, 'days').format('YYYY-MM-DD'),
  today: moment().format('YYYY-MM-DD'),
};
const months = {
  setPast: (n) => moment().subtract(n, 'months').format('YYYY-MM-DD'),
  setFuture: (n) => moment().add(n, 'months').format('YYYY-MM-DD'),
  currentMonth: moment().clone().startOf('month').format('YYYY-MM-DD'),
  firstDay: (date) =>
    moment(date).clone().startOf('month').format('YYYY-MM-DD'),
  lastDay: (date) => moment(date).clone().endOf('month').format('YYYY-MM-DD'),
};

const t24Hours = new Date(new Date().getTime() + 1000 * 60 * 60 * 24);

const dateOnly = (dateTime) => moment(dateTime).format('YYYY-MM-DD');

/**
 * Takes an array of date values, and returns the next month
 * @param {array} dateArr array of date values
 * @returns date in the format (YYYY-MM-DD)
 */
const getNextMonth = (dateArr) =>
  moment(dateArr[dateArr.length - 1])
    .add(1, 'months')
    .format('YYYY-MM-DD');

const firstDayOfYear = (date) =>
  moment(date).clone().startOf('year').format('YYYY-MM-DD');

const dateInWords = (date) => moment(date).format('MMMM YYYY');

const delayInSeconds = (timeout) =>
  new Promise((res) => {
    setTimeout(() => {
      res();
    }, timeout * 1000);
  });

const setMinutes = (numOfMinutes) => {
  let twentyMinutesLater = new Date();
  twentyMinutesLater.setMinutes(twentyMinutesLater.getMinutes() + numOfMinutes);
  return twentyMinutesLater;
};

const isFutureMonth = (month) =>
  new Date(month).getTime() > new Date(months.currentMonth).getTime();

module.exports = {
  moment,
  days,
  t24Hours,
  months,
  dateOnly,
  getNextMonth,
  firstDayOfYear,
  dateInWords,
  firstDayOfLastMonth: months.firstDay(months.setPast(1)),
  delayInSeconds,
  isFutureMonth,
  setMinutes,
};
