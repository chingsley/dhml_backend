export const setMinutes = (x) => new Date(Date.now() + Number(x) * 60 * 1000);

// export function getRandomInt(max) {
//   return Math.floor(Math.random() * Math.floor(max) - 1);
// }

export function getRandomInt(max, options = {}) {
  const { min = 0 } = options;
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export const zeroPadding = (id, maxLength = 5) => {
  // const maxLength = 5;
  if (Number(id).toString().length < maxLength) {
    return '0'.repeat(maxLength - Number(id).toString().length) + Number(id);
  } else {
    return id.toString();
  }
};

export const getAvailableIds = (pool, taken) => {
  const flush = (result) => {
    if (result.temp.length < 3) {
      result.main.push(result.temp.join(','));
    } else {
      result.main.push(
        `${result.temp[0]} - ${result.temp[result.temp.length - 1]}`
      );
    }
  };
  const result = pool.reduce(
    (rtValue, id, index) => {
      if (!taken.includes(id)) {
        if (rtValue.temp.length === 0) {
          rtValue.temp.push(id);
        } else if (id - rtValue.temp[rtValue.temp.length - 1] < 2) {
          rtValue.temp.push(id);
        } else {
          flush(rtValue);
          rtValue.temp = [id];
        }
      }
      if (index === pool.length - 1) {
        flush(rtValue);
        rtValue.temp = [];
      }
      return rtValue;
    },
    { temp: [], main: [] }
  );

  return result.main;
};
