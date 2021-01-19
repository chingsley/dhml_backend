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

  /**
   *
   * @param {array} arrOfFields array of fields to filterBy
   * @param {object [optional]} map an object that maps the query param to the actual field name in the table
   * map essentially says (for e.g): 'if you see 'hcpName' in the param, look for 'name' in the hcp table
   * b/c the field 'name' is what we have in the hcp table, not hcpName.
   * If no map is specified, it searches the table fields by the keys in the req params,
   * e.g the param firstName='John', when map is empty will search in the table where 'firstName'
   * is like 'John'. But the param hcpCode='FCT/0091/S' with map specified as { code: hcpCode } will
   * search in the table where 'code' is like 'FCT/0091/S'
   */
  filterBy(arrOfFields, map = {}) {
    const queryParams = this.query;
    const filterObj = arrOfFields.reduce((obj, key) => {
      if (queryParams[key]) {
        const field = map[key] || key;
        const value = queryParams[key];
        return { ...obj, [field]: { [Op.like]: `%${value}%` } }; // use .toLowercase => ueryParams[key].toLowerCase(), but first you have to convert all value to lower case before saving in the database
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
