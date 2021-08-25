/* eslint-disable indent */
import AppService from '../app/app.service';
import statsScripts from '../../database/scripts/stats.scripts';

export default class ReportService extends AppService {
  constructor({ body, files, query, params, user: operator }) {
    super({ body, files, query, params, operator });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
    this.operator = operator;
  }

  async getGeneralStatistics() {
    const bulkQuery = statsScripts.map((script) =>
      this.executeQuery(script, {}, script.name)
    );
    const results = await Promise.all(bulkQuery);
    return results.reduce((acc, obj) => {
      acc = { ...acc, ...obj };
      return acc;
    }, {});
  }
}
