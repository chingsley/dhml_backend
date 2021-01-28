import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import db from '../../database/models';
import { throwError } from '../../shared/helpers';
import { QueryTypes } from 'sequelize';
import { enrolleeSearchItems } from '../../shared/attributes/enrollee.attributes';

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

  async findOneRecord(options = {}) {
    const {
      modelName,
      where = {},
      include = [],
      isRequired = true,
      errorIfNotFound,
    } = options;
    const record = await db[modelName].findOne({
      where,
      include,
    });
    if (!record && isRequired) {
      throwError({
        status: 400,
        errorMsg: errorIfNotFound || `Missing record for ${modelName}`,
      });
    }
    return record;
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

  async ensureValidStaffNumber(staffIdNo) {
    if (staffIdNo) {
      await this.findOneRecord({
        where: { staffIdNo },
        modelName: 'Staff',
        errorIfNotFound: `Invalid staffIdNo, no record found for ID ${staffIdNo}`,
        include: {
          model: db.User,
          as: 'userInfo',
        },
      });
    }
  }

  async ensureValidHcpId(hcpId) {
    if (hcpId) {
      await this.findOneRecord({
        where: { id: hcpId },
        modelName: 'HealthCareProvider',
        errorIfNotFound: `Invalid hcpId, no record found for ID ${hcpId}`,
      });
    }
  }

  executeQuery(queryFunction, reqQuery) {
    const { dialect, database } = db.sequelize.options;
    return db.sequelize.query(queryFunction(dialect, database, reqQuery), {
      type: QueryTypes.SELECT,
    });
  }

  throwError = (responseObj) => {
    throw new Error(JSON.stringify(responseObj));
  };

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
  filterBy(arrOfFields, options = {}) {
    const { map = {} } = options;
    const queryParams = this.query;
    const filterObj = arrOfFields.reduce((obj, key) => {
      if (queryParams[key]) {
        const field = map[key] || key;
        const value = queryParams[key];
        return { ...obj, [field]: { [Op.iLike]: `%${value}%` } }; // use .toLowercase => ueryParams[key].toLowerCase(), but first you have to convert all value to lower case before saving in the database
      }
      return obj;
    }, {});

    return filterObj;
  }
  exactMatch(arrOfFields, options = {}) {
    const { map = {} } = options;
    const queryParams = this.query;
    const filterObj = arrOfFields.reduce((obj, key) => {
      if (queryParams[key]) {
        const field = map[key] || key;
        const value = queryParams[key];
        return { ...obj, [field]: value };
      }
      return obj;
    }, {});

    return filterObj;
  }

  searchBy = (searchableFields) => {
    const { field, value } = this.query;
    if (field && value && searchableFields.includes(field)) {
      return this.getSearchQuery(field, value);
    } else if (value && !field) {
      return {
        [Op.or]: searchableFields.map((field) => ({
          [field]: { [Op.iLike]: `%${value.toLowerCase()}%` },
        })),
      };
    } else {
      return {};
    }
  };

  getSearchQuery(field, value) {
    if (value === 'all') {
      return { [field]: { [Op.not]: null } };
    } else if (value === 'none') {
      return { [field]: { [Op.is]: null } };
    } else {
      return { [field]: { [Op.iLike]: `%${value.toLowerCase()}%` } };
    }
  }
  queryVerifiedEnrollees(hcpId, searchModels) {
    return db.Enrollee.findAndCountAll({
      where: {
        hcpId,
        isVerified: true,
        ...(searchModels.includes('Enrollee')
          ? this.searchBy(enrolleeSearchItems)
          : {}),
      },
      ...this.paginate(),
      order: [['dateVerified', 'DESC']],
      include: {
        model: db.HealthCareProvider,
        as: 'hcp',
        where: {
          ...(searchModels.includes('HealthCareProvider')
            ? this.searchBy(['code', 'name'])
            : {}),
        },
      },
    });
  }
}
