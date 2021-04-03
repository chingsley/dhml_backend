/* eslint-disable indent */
import { Op } from 'sequelize';
import AppService from '../app/app.service';
import db from '../../database/models';

export default class DevService extends AppService {
  constructor({ body, files, query, params }) {
    super({ body, files, query, params });
    this.reqBody = body;
    this.files = files;
    this.query = query;
    this.params = params;
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
}