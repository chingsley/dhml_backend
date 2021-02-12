import bcrypt from 'bcryptjs';
import supertest from 'supertest';
import moment from 'moment';
import { Op } from 'sequelize';

import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import db from '../../../src/database/models';
import getSampleUsers from '../../../src/shared/samples/user.samples';
import { TEST_PASSWORD } from '../../../src/shared/constants/passwords.constants';
import server from '../../../src/server';
import Cypher from '../../../src/utils/Cypher';
import getSampleHCPs from '../../../src/shared/samples/hcp.samples';
import getEnrollees from '../../../src/shared/samples/enrollee.samples';
import NanoId from '../../../src/utils/NanoId';
import { HCP } from '../../../src/shared/constants/roles.constants';

const { AES_KEY, IV_KEY, BCRYPT_SALT } = process.env;
export const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
export const today = moment().format('YYYY-MM-DD');
export const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

const app = supertest(server.server);
const cypher = new Cypher(AES_KEY, IV_KEY);

class TestService {
  static getSampleEnrollees(options) {
    return getEnrollees(options);
  }

  static async resetDB(modelsArr) {
    if (modelsArr) {
      if (modelsArr && !Array.isArray(modelsArr)) {
        throw new Error(
          '"resetDB" expects an optional array of models as argument'
        );
      }
      for (let i = 0; i < modelsArr.length; i++) {
        await modelsArr[i].destroy({ where: {}, truncate: { cascade: true } });
      }
    } else {
      const dbHcp = db.HealthCareProvider;
      await db.Enrollee.destroy({ where: {}, truncate: { cascade: true } });
      await db.Password.destroy({ where: {}, truncate: { cascade: true } });
      await db.User.destroy({ where: {}, truncate: { cascade: true } });
      await db.Staff.destroy({ where: {}, truncate: { cascade: true } });
      await db.Role.destroy({ where: {}, truncate: { cascade: true } });
      await dbHcp.destroy({ where: {}, truncate: { cascade: true } });
    }
  }

  static async seedStaffs(staffs) {
    return db.Staff.bulkCreate(staffs);
  }

  static async seedUsers(noOfUsers = 1, userRole = 'dept user') {
    const { sampleStaffs } = getSampleStaffs(noOfUsers);
    const { sampleUsers } = getSampleUsers(sampleStaffs);
    const staffs = await db.Staff.bulkCreate(sampleStaffs);
    const role = await db.Role.create({ title: userRole });
    const usersSeed = sampleUsers.map((user, index) => {
      return {
        ...user,
        staffId: staffs[index].id,
        roleId: role.id,
      };
    });
    const users = await db.User.bulkCreate(usersSeed);
    const password = this.getHash('Testing*123');
    await db.Password.bulkCreate(
      users.map((user) => ({
        userId: user.id,
        value: password,
      }))
    );
    return { users };
  }

  static async getToken(sampleStaff, roleTitle) {
    const { sampleUsers } = getSampleUsers([sampleStaff]);
    const [staff] = await db.Staff.upsert(sampleStaff, { returning: true });
    const role = await this.createRole(roleTitle);
    const user = await this.createUser({
      ...sampleUsers[0],
      roleId: role.id,
      staffId: staff.id,
    });
    await this.createPassword(user.id, TEST_PASSWORD);
    const res = await this.loginUser(user.email, TEST_PASSWORD);
    const { data } = res.body;
    return { user: data.user, token: data.token };
  }

  static async createRole(roleTitle) {
    let role = await db.Role.findOne({ where: { title: roleTitle } });
    if (!role) {
      role = await db.Role.create({ title: roleTitle });
    }
    return role;
  }

  static async createUser(user) {
    const [result] = await db.User.upsert(user, { returning: true });
    return result;
  }

  static loginUser(email, password) {
    return app.post('/api/v1/auth/login').send(
      cypher.formatRequest({
        email,
        password,
        userType: 'user',
      })
    );
  }

  static async createPassword(userId, value) {
    const [hashed] = await db.Password.upsert(
      {
        userId,
        value: this.getHash(value),
        isDefaultValue: false,
      },
      { returning: true }
    );
    return hashed;
  }

  static async seedHCPs(count) {
    let hcpRole = await db.Role.findOne({ where: { title: HCP } });
    if (!hcpRole) {
      hcpRole = await db.Role.create({ title: HCP });
    }
    return db.HealthCareProvider.bulkCreate(
      getSampleHCPs(count).map((hcp) => ({
        ...hcp,
        roleId: hcpRole.id,
      }))
    );
  }

  static getHash(sampleValue = 'Testing*123') {
    return bcrypt.hashSync(sampleValue, Number(BCRYPT_SALT));
  }

  static fetchEnrolleeByIdNo(enrolleeIdNo) {
    return db.Enrollee.findOne({ where: { enrolleeIdNo } });
  }

  static async findAfrshipPrincipal({ hcpId }) {
    const serviceNumber = await TestService.getUniqueValue();
    const afrshipPrincipal = await TestService.getRegisteredPrincipal({
      scheme: 'AFRSHIP',
      withValues: {
        serviceNumber,
        staffNumber: undefined,
        hcpId,
      },
    });
    return afrshipPrincipal;
  }
  static async findRegStaff(staffIdNo, staffFileNo) {
    let staff = await db.Staff.findOne({ where: { staffIdNo, staffFileNo } });
    if (!staff) {
      const { sampleStaffs } = getSampleStaffs(1);
      staff = await db.Staff.create({
        ...sampleStaffs[0],
        staffIdNo,
        staffFileNo,
      });
    }
    return staff;
  }
  static async findDsshipPrincipal({ hcpId }) {
    const staffNumber = await this.getUniqueValue();
    const staffFileNo = await this.getUniqueValue();
    const staff = await this.findRegStaff(staffNumber, staffFileNo);
    const afrshipPrincipal = await TestService.getRegisteredPrincipal({
      scheme: 'DSSHIP',
      withValues: {
        staffNumber: staff.staffIdNo,
        serviceNumber: undefined,
        hcpId,
      },
    });
    return afrshipPrincipal;
  }

  static async getRegisteredPrincipal({ scheme, withValues }) {
    let principal = await db.Enrollee.findOne({
      where: {
        scheme: { [Op.iLike]: scheme.toLowerCase() },
        principalId: { [Op.is]: null },
      },
    });
    if (!principal) {
      const { principals } = this.getSampleEnrollees({ numberOfPrincipals: 1 });
      const enrolleeIdNo = await db.Enrollee.generateNewPrincipalIdNo();
      principal = await db.Enrollee.create({
        ...principals[0],
        enrolleeIdNo,
        scheme,
        ...withValues,
      });
    }
    return principal;
  }

  static async getUniqueValue() {
    return await NanoId.getValue({
      length: 7,
      model: db.Enrollee,
      fields: ['serviceNumber', 'staffNumber'],
      checkDuplicates: true,
    });
  }

  static removeUnwantedFields(sampleDependant) {
    const notAllowed = [
      'enrolleeIdNo',
      'isVerified',
      'dateVerified',
      'dependantClass',
      'dependantType',
    ];
    return Object.entries(sampleDependant).reduce((dependant, [key, value]) => {
      if (!notAllowed.includes(key)) dependant[key] = value;
      return dependant;
    }, {});
  }

  static getPasswordByUserId(userId) {
    return db.Password.findOne({ where: { userId } });
  }

  static getPasswordByHcpId(hcpId) {
    return db.Password.findOne({ where: { hcpId } });
  }

  static removeNullValues(arrOfEnrollees) {
    return arrOfEnrollees.map((enrollee) => ({
      ...Object.entries(enrollee).reduce((enrollee, [key, value]) => {
        if (value === null) {
          enrollee[key] = undefined;
        } else {
          enrollee[key] = value;
        }
        return enrollee;
      }, {}),

      enrolleeIdNo: undefined,
      isVerified: undefined,
      dateVerified: undefined,
    }));
  }

  static seedEnrollees(enrollees) {
    return db.Enrollee.bulkCreate(enrollees);
  }

  static testCatchBlock = (method) => async (done) => {
    try {
      const req = undefined;
      const res = { body: {} };
      const next = jest.fn();
      await method(req, res, next);
      expect(next).toHaveBeenCalled();
      done();
    } catch (e) {
      done(e);
    }
  };
}

export default TestService;
