import AppService from '../app/app.service';
import claimsScripts from '../../database/scripts/claims.scripts';

export default class FFSService extends AppService {
  constructor({ body, files, query, params }) {
    super({ body, files, query, params });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
  }

  async getClaimsSumByHcpSvc() {
    const script = claimsScripts.getClaimsByHcp;
    const nonPaginatedRows = await this.executeQuery(script, {
      ...this.query,
      pageSize: undefined,
      page: undefined,
    });
    const count = nonPaginatedRows.length;
    const rows = await this.executeQuery(script, this.query);
    const total = nonPaginatedRows.reduce((acc, record) => {
      acc += Number(record.amount);
      return acc;
    }, 0);
    return { count, rows, total };
  }
}
