import { Op } from 'sequelize';

export default class AppService {
  constructor(req, res) {
    this.req = req;
    this.res = res;
  }

  filterBy(arrOfFields) {
    const queryParams = this.req.query;
    const filterObj = arrOfFields.reduce((obj, key) => {
      if (queryParams[key]) {
        return { ...obj, [key]: { [Op.like]: `%${queryParams[key]}%` } };
      }
      return obj;
    }, {});

    return filterObj;
  }

  paginate() {
    const { page, pageSize } = this.req.query;
    if (page && pageSize) {
      return {
        offset: Number(page * pageSize),
        limit: Number(pageSize),
      };
    }
  }

  throwError = (responseObj) => {
    throw new Error(JSON.stringify(responseObj));
  };
}
