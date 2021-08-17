/* eslint-disable indent */
import { Op } from 'sequelize';
import AppService from '../app/app.service';
import db from '../../database/models';

export default class DevService extends AppService {
  constructor({ body, files, query, params, user: operator }) {
    super({ body, files, query, params, operator });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
    this.operator = operator;
  }

  async updateDependantInfo() {
    const t = await db.sequelize.transaction();
    try {
      const dependants = await db.Enrollee.findAll({
        where: {
          principalId: { [Op.not]: null },
          armOfService: { [Op.is]: null },
        },
        include: {
          model: db.Enrollee,
          as: 'principal',
          where: { armOfService: { [Op.not]: null } },
        },
      });
      for (let dependant of dependants) {
        await dependant.update(
          { armOfService: dependant.principal.armOfService },
          { transaction: t }
        );
      }
      await t.commit();
      return { message: `updated ${dependants.length} dependants` };
    } catch (error) {
      await t.rollback();
      this.throwError({
        status: 400,
        error: [`update failed: ${error.message}`],
      });
    }
  }

  async updateOrCreateRole() {
    const roleTitle = this.body.role;
    let role = await db.Role.findOne({ where: { title: roleTitle } });
    if (!role) {
      role = await db.Role.create({ title: roleTitle });
    }
    return role;
  }
}
