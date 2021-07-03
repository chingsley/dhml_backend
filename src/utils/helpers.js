import {
  SERVICE_STATUS,
  SERVICE_STATUS_CODE,
} from '../shared/constants/lists.constants';
import { Joi } from '../validators/joi/config';

export const setMinutes = (x) => new Date(Date.now() + Number(x) * 60 * 1000);

export const isEmptyObject = (obj) =>
  Object.keys(obj).length === 0 && obj.constructor === Object;

// the maximum will never be reached
export function getRandomInt(max, options = {}) {
  const { min = 0 } = options;
  return Math.floor(Math.random() * (max - min) + min);
}

// // range from min to max (both inclusive)
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// // range of real numbers from min to max (both inclusive)
export function randNum(min, max) {
  return Math.random() * (max - min + 1) + min;
}

/**
 *
 * @param {array} arr an array of items
 * @returns a random item from the array
 */
export const _random = (arr) => arr[randInt(0, arr.length - 1)];

export function getRandomIntArr(min, max, count) {
  let n = 0;
  const arrOfRandomIntegers = [];
  while (n < count) {
    arrOfRandomIntegers.push(randInt(min, max));
    n += 1;
  }
  return arrOfRandomIntegers;
}

export const zeroPadding = (id, maxLength = 6) => {
  if (Number(id).toString().length < maxLength) {
    return '0'.repeat(maxLength - Number(id).toString().length) + Number(id);
  } else {
    return id.toString();
  }
};

export const isExpired = (expiryDate) => {
  return expiryDate.getTime() - new Date().getTime() < 0;
};

export const downcaseAllFields = (arrayOfObjects) => {
  const converted = arrayOfObjects.map((hcp) => {
    return Object.entries(hcp).reduce((result, [key, value]) => {
      if (typeof value === 'string') {
        result[key] = value.toLowerCase();
      } else {
        result[key] = value;
      }
      return result;
    }, {});
  });
  return converted;
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

export function isBoolean(value) {
  try {
    const expected = [true, false];
    const result = JSON.parse(value);
    return expected.includes(result);
  } catch (e) {
    return false;
  }
}

export function isValidDate(date) {
  const dateSchema = Joi.date().format('YYYY-MM-DD').required();
  const result = dateSchema.validate(`${date}`);
  return !result.error;
}

export function getServiceStatusCode(enrolleeServiceStatus) {
  return enrolleeServiceStatus
    ? enrolleeServiceStatus === SERVICE_STATUS.SERVING
      ? SERVICE_STATUS_CODE.SERVING
      : SERVICE_STATUS_CODE.RETIRED
    : SERVICE_STATUS_CODE.AD;
}
