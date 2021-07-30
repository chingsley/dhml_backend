import { QueryTypes } from 'sequelize';

class ScriptRunner {
  constructor(sequelize) {
    this.sequelize = sequelize;
  }

  async execute(queryFunction, reqQuery, key) {
    const { dialect, database } = this.sequelize.options;
    const rows = await this.sequelize.query(
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
