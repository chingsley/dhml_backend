/* eslint-disable jest/expect-expect */
import faker from 'faker';
import { days, months } from '../../../src/utils/timers';
import TestService from '../app/app.test.service';
import { randInt } from '../../../src/utils/helpers';
import moment from 'moment';
import { Op } from 'sequelize';
import db from '../../../src/database/models';
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
export const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
export const today = moment().format('YYYY-MM-DD');
export const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

class EnrolleeTest extends TestService {
  static async addDependantsToPrincipal(dependants, principal) {
    return await db.Enrollee.bulkCreate(
      dependants.map((dependant) => ({
        ...dependant,
        principalId: principal.id,
        scheme: principal.scheme,
        hcpId: principal.hcpId,
      }))
    );
  }
  static getPrincipalDependants(principalId) {
    return db.Enrollee.findAll({ where: { principalId } });
  }

  static async getEnrolleesByIdArray(idArr) {
    return db.Enrollee.findAll({ where: { id: { [Op.in]: idArr } } });
  }

  static findById(id) {
    return db.Enrollee.findOne({
      where: { id },
      include: { model: db.Enrollee, as: 'dependants' },
    });
  }
  static async seedAfrship(sampleEnrollees, hcps) {
    const principals = sampleEnrollees.principals;
    const seededPrincipals = await TestService.seedEnrollees(
      principals.map((principal, i) => ({
        ...principal,
        scheme: 'AFRSHIP',
        enrolmentType: 'principal',
        serviceNumber: `NN/000${i}`,
        hcpId: hcps[randInt(0, hcps.length - 1)].id,
        isVerified: true,
        dateVerified: faker.date.between(months.setPast(3), days.today),
        staffNumber: null,
      }))
    );
    const deps = sampleEnrollees.dependants.map((d) => {
      for (let p of seededPrincipals) {
        const regexPrincipalEnrolleeIdNo = new RegExp(`${p.enrolleeIdNo}-`);
        if (d.enrolleeIdNo.match(regexPrincipalEnrolleeIdNo)) {
          return {
            ...d,
            principalId: p.id,
            hcpId: p.hcpId,
          };
        }
      }
    });
    const seededDependants = await TestService.seedEnrollees(deps);
    return { principals: seededPrincipals, dependants: seededDependants };
  }

  // keyValues = { hcpId, scheme, serviceNumber, staffNumber, staffFileNo }
  static async findOrCreatePrincipal(keyValues) {
    const { scheme } = keyValues;
    let principal = await db.Enrollee.findOne({
      where: {
        scheme: { [Op.iLike]: scheme.toLowerCase() },
        principalId: { [Op.is]: null },
      },
      include: [{ model: db.Enrollee, as: 'dependants' }],
    });
    if (!principal) {
      if (scheme === 'DSSHIP') {
        const { staffNumber } = keyValues;
        const { sampleStaffs } = getSampleStaffs(1);

        await db.Staff.create({
          ...sampleStaffs[0],
          staffIdNo: staffNumber,
        });
      }
      const { principals } = this.getSampleEnrollees({ numberOfPrincipals: 1 });
      const enrolleeIdNo = await db.Enrollee.generateNewPrincipalIdNo();
      principal = await db.Enrollee.create({
        ...principals[0],
        ...keyValues,
        enrolleeIdNo,
      });
    }
    return principal;
  }

  static async deleteDependants(principal) {
    const dependantIds = principal.dependants?.map((d) => d.id);
    return db.Enrollee.destroy({ where: { id: dependantIds || [] } });
  }
}

export default EnrolleeTest;
