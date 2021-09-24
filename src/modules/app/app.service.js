import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import db from '../../database/models';
import { QueryTypes } from 'sequelize';
import { isBoolean, isValidDate } from '../../utils/helpers';
import timers from '../../utils/timers';
import {
  passwordMsgTemplate,
  passwordResetTokenTemplate,
} from '../../utils/templates/forPassword';
import NanoId from '../../utils/NanoId';
import appHelpers from './app.helpers';
import Sendgrid from '../../utils/Sendgrid/index';
import { TOKEN_TYPES, USERTYPES } from '../../shared/constants/lists.constants';

export default class AppService {
  constructor({ body, files, query, params, operator }) {
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
    this.operator = operator;
  }

  record(action) {
    if (!this.operator) {
      throw new Error(
        'AppService was initiated as Super(...) without a value for operator; operator is required'
      );
    }
    db.AuditLog.logAction({
      operator: this.operator,
      action,
    });
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
        if (found && found.id !== resourceId) {
          this.throwError({
            status: 400,
            error: [`${resourceType} with ${field}: ${value} already exists`],
          });
        }
      }
    }
  }

  async validateId(modelName, id) {
    return await this.findOneRecord({
      modelName,
      where: { id },
      isRequired: true,
      errorIfNotFound: `No ${modelName} matches the id of ${id}`,
    });
  }
  validateIdArr(modelName, idArr) {
    return Promise.all(idArr.map((id) => this.validateId(modelName, id)));
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
      this.throwError({
        status: status || 400,
        error: errorIfNotFound
          ? [errorIfNotFound]
          : [`Missing record for ${modelName}`],
        errorCode,
      });
    }
    return record;
  }

  async getCapSumById(id, { rejectCurrentMonth } = {}) {
    const capSum = await this.findOneRecord({
      modelName: 'GeneralMonthlyCapitation',
      where: { id },
      errorIfNotFound: `no capitation summary was found with id ${id}`,
      include: [
        {
          model: db.Voucher,
          as: 'voucher',
          attributes: ['id', ['createdAt', 'auditRequestedOn']],
        },
      ],
    });
    this.rejectIf(rejectCurrentMonth && capSum.isCurrentMonth, {
      withError:
        'Operation not allowed on current running capitation until month end',
    });

    return capSum;
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

  async executeQuery(queryFunction, reqQuery, key) {
    const { dialect, database } = db.sequelize.options;
    // console.log(queryFunction(dialect, database, reqQuery));
    const rows = await db.sequelize.query(
      queryFunction(dialect, database, reqQuery),
      {
        type: QueryTypes.SELECT,
      }
    );
    if (key) {
      return { [key]: rows };
    } else {
      return rows;
    }
  }

  async getPaginatedData(script, query) {
    const nonPaginatedRows = await this.executeQuery(script, {
      ...query,
      pageSize: undefined,
      page: undefined,
    });
    const count = nonPaginatedRows.length;
    const rows = await this.executeQuery(script, {
      ...this.query,
    });
    return { count, rows };
  }

  throwError = (responseObj) => {
    throw new Error(JSON.stringify(responseObj));
  };

  throwErrorIf(condition, options) {
    const { withMessage, status = 400 } = options;
    if (condition) {
      this.throwError({
        status,
        error: [withMessage],
      });
    }
  }

  rejectIf(condition, { withError, status = 400, errorCode }) {
    if (condition) {
      this.throwError({
        status: status,
        error: [withError],
        errorCode,
      });
    }
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
    // console.log({ filterObj });
    return filterObj;
  }
  exactMatch(arrOfFields, options = {}) {
    const { mapToColumn = {} } = options;
    const queryParams = this.query;
    const filterObj = arrOfFields.reduce((obj, key) => {
      if (queryParams[key]) {
        const field = mapToColumn[key] || key;
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
    !/(test|production)/.test(process.env.NODE_ENV) &&
      log('searchRecordsBy ===> ', conditions);

    return conditions;
  };

  searchByEnrolmentType(value) {
    if (value === 'dependant') {
      return { principalId: { [Op.not]: null } };
    } else if (value === 'principal') {
      return { principalId: { [Op.is]: null } };
    } else {
      this.throwError({
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

  async generateResetToken() {
    const pool = '123456789abcdefghijkmnoqrstuvwxyz_-';
    return await NanoId.getValue({ length: 12, pool });
  }

  sendPassword(email, password) {
    // return NodeMailer.sendMail({
    //   subject: 'INTEGRATED HEALTH MANAGEMENT SYSTEM',
    //   emails: email,
    //   html: passwordMsgTemplate(password),
    //   notificationType: 'password',
    // });
    return Sendgrid.send({
      subject: 'IHIMS NEW USER ACCOUNT',
      email,
      html: passwordMsgTemplate(password),
    });
  }

  handlePasswordResetNotification = async function (
    user,
    userType,
    TokenTable
  ) {
    if (user) {
      const resetToken = await this.generateResetToken();

      const message = passwordResetTokenTemplate(resetToken);

      await Sendgrid.send({
        subject: 'IHIMS PASSWORD RESET',
        email: user.email,
        html: message,
      });

      await TokenTable.create({
        userId: userType === USERTYPES.USER ? user.userInfo.id : null,
        hcpId: userType === USERTYPES.HCP ? user.id : null,
        value: resetToken,
        type: TOKEN_TYPES.PASSWORD_RESET_TOKEN,
        expiresAt: timers.setMinutes(15),
      });
    }
  };

  sumUp(rows, fields) {
    const initial = fields.reduce((acc, field) => {
      acc[field] = 0;
      return acc;
    }, {});

    return rows.reduce((acc, row) => {
      for (let key of Object.keys(initial)) {
        acc[key] += Number(row[key]);
      }
      return acc;
    }, initial);
  }

  get noTimeStamps() {
    return {
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    };
  }

  specialtyModel(db) {
    return {
      model: db.Specialty,
      as: 'specialties',
      attributes: ['id', 'name'],
      through: { attributes: [] },
    };
  }

  /**
   * Ensures the hcp making the claim is the receivingHcp
   * associated with the referal code specified req.body
   *
   * will skip the validation if operator is not a 'hcp' user...
   *  ...because state officers can prepare claims onbehalf of hcp's
   *
   * @param {object} operator app current user
   * @param {object} refcode the referal code
   */
  authorizeRefcodeRecevingHcp(operator, refcode, { withError } = {}) {
    if (operator.userType === USERTYPES.HCP) {
      const hcpId = operator.id;
      this.rejectIf(refcode.receivingHcpId !== hcpId, {
        withError:
          withError ||
          'Invalid Referal Code, please check the code and try again. REFC003',
        status: 401,
      });
    }

    return true;
  }
}

Object.assign(AppService.prototype, appHelpers);
