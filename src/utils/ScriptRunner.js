import { QueryTypes } from 'sequelize';

class ScriptRunner {
  constructor(db) {
    this.db = db;
  }

  async execute(queryFunction, reqQuery, key) {
    const { dialect, database } = this.db.sequelize.options;
    const rows = await this.db.sequelize.query(
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
}

export default ScriptRunner;
