import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import db from '../../database/models';
import { throwError } from '../../shared/helpers';

export default class AppService {
  constructor({ body, files, query }) {
    this.body = body;
    this.files = files;
    this.query = query;
  }

  async validateUnique(
    fields,
    { model, reqBody, resourceId = undefined, resourceType }
  ) {
    for (let field of fields) {
      const value = reqBody[field];
      if (value) {
        const found = await model.findOne({
          where: { [field]: value },
        });
        if (found && found.id !== resourceId) {
          throwError({
            status: 400,
            error: [`${resourceType} with ${field}: ${value} already exists`],
          });
        }
      }
    }
  }

  async validateStaffIdNo(staffIdNo) {
    return await db.Staff.findByStaffIdNo(staffIdNo, {
      throwErrorIfNotFound: true,
      errorMsg: `Staff ID: ${staffIdNo} not found`,
    });
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
    const { page, pageSize } = this.query;
    if (page && pageSize) {
      return {
        offset: Number(page * pageSize) || 0,
        limit: Number(pageSize) || null,
      };
    }
  }

  hashPassword(passwordString) {
    const BCRYPT_SALT = Number(process.env.BCRYPT_SALT);
    const hashedPassword = bcrypt.hashSync(passwordString, BCRYPT_SALT);
    return hashedPassword;
  }

  throwError = (responseObj) => {
    throw new Error(JSON.stringify(responseObj));
  };
}
