import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import db from '../../database/models';
import { throwError } from '../../shared/helpers';
import { QueryTypes } from 'sequelize';
import { isBoolean, isValidDate } from '../../utils/helpers';
import NodeMailer from '../../utils/NodeMailer';
import { passwordMsgTemplate } from '../../utils/templates/forPassword';
import NanoId from '../../utils/NanoId';

export default class AppService {
  constructor({ body, files, query }) {
    this.body = body;
    this.files = files;
    this.query = query;
  }

  async validateUnique(
    fields,
    {
      model,
      reqBody,
      resourceId = undefined,
      resourceType,
      nonStringDataTypes = [],
    }
  ) {
    for (let field of fields) {
      const value = reqBody[field];
      let condition;
      if (nonStringDataTypes.includes(field)) {
        condition = { [field]: value };
      } else {
        condition = { [field]: { [Op.iLike]: value } };
      }
      if (value) {
        const found = await model.findOne({
          where: condition,
        });
        // console.log({
        //   value,
        //   condition,
        //   found,
        //   'found.id': found.id,
        //   resourceId,
        // });
        if (found && found.id !== resourceId) {
          throwError({
            status: 400,
            error: [`${resourceType} with ${field}: ${value} already exists`],
          });
        }
      }
    }
  }

  // async validateStaffId(staffId) {
  //   return await this.findOneRecord({
  //     modelName: 'Staff',
  //     where: { id: staffId },
  //     isRequired: true,
  //     errorIfNotFound: `Staff ID: ${staffId} not found`,
  //   });
  // }
  async validateId(modelName, id) {
    return await this.findOneRecord({
      modelName,
      where: { id },
      isRequired: true,
      errorIfNotFound: `No ${modelName} matches the id of ${id}`,
    });
  }

  async findOneRecord(options = {}) {
    const {
      modelName,
      where = {},
      include = [],
      isRequired = true,
      errorIfNotFound,
      errorCode,
      status,
    } = options;
    const record = await db[modelName].findOne({
      where,
      include,
    });
    if (!record && isRequired) {
      throwError({
        status: status || 400,
        error: errorIfNotFound
          ? [errorIfNotFound]
          : [`Missing record for ${modelName}`],
        errorCode,
      });
    }
    return record;
  }

  /**
   * NOTE: In the if() block here, I could use if(page && pageSize)
   * but that leads to a bug, because if page is '0' in req.query,
   * and if a middleware (like joi) converts the string '0' to the
   * number 0 (as in Number('0')), then the 'if' condition will fail,
   * becase the number 0 is falsy. That is why I used !== undefined so
   * as to be more specific and avoid such bug.
   */
  paginate() {
    const { page, pageSize } = this.query;
    if (page !== undefined && pageSize !== undefined) {
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
        where: { staffIdNo: { [Op.iLike]: staffIdNo } },
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
        return { ...obj, [field]: { [Op.iLike]: `%${value}%` } };
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

  searchRecordsBy = (searchableFields) => {
    const { searchField, searchValue, searchItem } = this.query;
    const allowedFields = searchableFields.map(({ name }) => name);
    let conditions = {};
    if (searchField && searchValue && allowedFields.includes(searchField)) {
      conditions = this.getSearchQuery(searchField, searchValue, {
        searchableFields,
      });
    }
    if (searchItem) {
      conditions = {
        ...conditions,
        ...{
          [Op.or]: searchableFields.map((field) => {
            if (field.type === 'string') {
              return {
                [field.name]: { [Op.iLike]: `%${searchItem.toLowerCase()}%` },
              };
            } else {
              return {};
            }
          }),
        },
      };
    }
    const { log } = console;
    process.env.NODE_ENV === 'development' &&
      log('searchRecordsBy ===> ', conditions);
    return conditions;
  };

  searchByEnrolmentType(value) {
    if (value === 'dependant') {
      return { principalId: { [Op.not]: null } };
    } else if (value === 'principal') {
      return { principalId: { [Op.is]: null } };
    } else {
      throwError({
        status: 400,
        error:
          'Invalid value for enrolment type. Allowed values are "dependant" or "principal"',
      });
    }
  }

  getSearchQuery(searchField, searchValue, { searchableFields }) {
    const field = searchableFields.find(({ name }) => name === searchField);
    if (searchField === 'enrolmentType') {
      return this.searchByEnrolmentType(searchValue);
    } else if (searchValue === 'all') {
      return { [searchField]: { [Op.not]: null } };
    } else if (field.type === 'number' && Number(searchValue)) {
      return { [searchField]: Number(searchValue) };
    } else if (field.type === 'string') {
      return {
        [searchField]: { [Op.iLike]: searchValue.toLowerCase() },
      };
    } else if (field.type === 'boolean' && isBoolean(searchValue)) {
      return {
        [searchField]: JSON.parse(searchValue),
      };
    } else if (field.type === 'date' && isValidDate(searchValue)) {
      const fromDate = new Date(searchValue);
      const fromDateCopy = new Date(searchValue);
      const toDate = new Date(fromDateCopy.setDate(fromDateCopy.getDate() + 1));
      return {
        [searchField]: {
          [Op.between]: [fromDate, toDate],
        },
      };
    } else {
      return {};
    }
  }

  async createDefaultPassword(idObj, trnx) {
    const defaultPass = await this.generateDefaultPwd();
    if (trnx) {
      await db.Password.create(
        { ...idObj, value: this.hashPassword(defaultPass) },
        trnx
      );
    } else {
      await db.Password.create({
        ...idObj,
        value: this.hashPassword(defaultPass),
      });
    }
    return defaultPass;
  }

  async generateDefaultPwd() {
    const pool =
      '123456789ABCDEFGHJKLMNQRSTUVWXYZabcdefghijkmnoqrstuvwxyz*$#@!^_-+&';
    return await NanoId.getValue({ length: 8, pool });
  }

  sendPassword(email, password) {
    return NodeMailer.sendMail({
      subject: 'INTEGRATED HEALTH MANAGEMENT SYSTEM',
      emails: email,
      html: passwordMsgTemplate(password),
      notificationType: 'password',
    });
  }
}
