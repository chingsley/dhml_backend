import supertest from 'supertest';
import moment from 'moment';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import db from '../../../src/database/models';
import getSampleUsers from '../../../src/shared/samples/user.samples';
import { TEST_PASSWORD } from '../../../src/shared/constants/passwords.constants';
import server from '../../../src/server';
import Cypher from '../../../src/utils/Cypher';
import Password from '../../../src/utils/Password';
import getSampleHCPs from '../../../src/shared/samples/hcp.samples';
import getEnrollees from '../../../src/shared/samples/enrollee.samples';
import NanoId from '../../../src/utils/NanoId';
import ROLES from '../../../src/shared/constants/roles.constants';

const { AES_KEY, IV_KEY } = process.env;
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
      const dbGmc = db.GeneralMonthlyCapitation;
      const dbHmc = db.HcpMonthlyCapitation;

      await db.Enrollee.destroy({ where: {}, truncate: { cascade: true } });
      await db.Password.destroy({ where: {}, truncate: { cascade: true } });
      await db.User.destroy({ where: {}, truncate: { cascade: true } });
      await db.Staff.destroy({ where: {}, truncate: { cascade: true } });
      await dbHmc.destroy({ where: {}, truncate: { cascade: true } });
      await dbGmc.destroy({ where: {}, truncate: { cascade: true } });
      await dbHcp.destroy({ where: {}, truncate: { cascade: true } });
      await db.Role.destroy({ where: {}, truncate: { cascade: true } });
    }
  }

  static async seedStaffs(staffs) {
    return db.Staff.bulkCreate(staffs);
  }

  static async seedUsers(noOfUsers = 1, userRole = ROLES.BASIC) {
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
    await this.createBulkPassword('userId', users, TEST_PASSWORD);
    const userIds = users.map((user) => user.id);
    return db.User.findAll({
      where: { id: userIds },
      include: { model: db.Staff, as: 'staffInfo' },
    });
  }

  static async seedHCPs(count) {
    let hcpRole = await db.Role.findOne({ where: { title: ROLES.HCP } });
    if (!hcpRole) {
      hcpRole = await db.Role.create({ title: ROLES.HCP });
    }
    const HCPs = await db.HealthCareProvider.bulkCreate(
      getSampleHCPs(count).map((hcp) => ({
        ...hcp,
        roleId: hcpRole.id,
      }))
    );
    await this.createBulkPassword('hcpId', HCPs, TEST_PASSWORD);
    return HCPs;
  }

  static createBulkPassword(idType, records, password) {
    return db.Password.bulkCreate(
      records.map((record) => ({
        [idType]: record.id,
        value: Password.hash(password),
      }))
    );
  }

  static async getHcpToken(seededHcp) {
    await this.createPassword('hcpId', seededHcp.id, TEST_PASSWORD);
    const res = await this.login({
      username: seededHcp.code,
      password: TEST_PASSWORD,
      userType: 'hcp',
    });
    const { data } = res.body;
    return { hcp: data.hcp, token: data.token };
  }

  static async getTokenMultiple(rolesArr, staffArr) {
    const token = {};
    for (let i = 0; i < rolesArr.length; i++) {
      const data = await this.getToken(staffArr[i], rolesArr[i]);
      token[rolesArr[i]] = data.token;
    }
    return token;
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
    await this.createPassword('userId', user.id, TEST_PASSWORD);
    const res = await this.login({
      email: staff.email,
      password: TEST_PASSWORD,
      userType: 'user',
    });
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
    let seededUser = await db.User.findOne({
      where: { staffId: user.staffId },
    });
    if (!seededUser) {
      seededUser = await db.User.create(user);
    } else {
      await seededUser.update(user);
      seededUser.reload({ include: { model: db.Role, as: 'role' } });
    }
    return seededUser;
  }

  static login({ email, username, userType, password }) {
    return app.post('/api/v1/auth/login').send(
      cypher.formatRequest({
        email,
        password,
        username,
        userType,
      })
    );
  }

  static async createPassword(idType, id, value) {
    let hashed = await db.Password.findOne({ where: { [idType]: id } });
    if (!hashed) {
      hashed = await db.Password.create({
        [idType]: id,
        value: Password.hash(value),
        isDefaultValue: false,
      });
    }
    return hashed;
  }

  static fetchEnrolleeByIdNo(enrolleeIdNo) {
    return db.Enrollee.findOne({ where: { enrolleeIdNo } });
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

  static seedAfrshipPrincipals(principals, hcp) {
    return this.seedEnrollees(
      principals.map((p, i) => {
        return {
          ...p,
          hcpId: hcp.id,
          serviceNumber: `SN/00${i}`,
          staffNumber: undefined,
        };
      })
    );
  }

  static seedDependants(dependants, seededDependantsPrincipals, hcp) {
    const dependantsWithPrincipalId = dependants.reduce((acc, dep) => {
      for (let { enrolleeIdNo, id } of seededDependantsPrincipals) {
        if (dep.enrolleeIdNo.match(new RegExp(`${enrolleeIdNo}-`))) {
          acc.push({ ...dep, principalId: id, hcpId: hcp.id });
        }
      }
      return acc;
    }, []);
    return this.seedEnrollees(dependantsWithPrincipalId);
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
