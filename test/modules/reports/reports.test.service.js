import moment from 'moment';
import db from '../../../src/database/models';
import TestService from '../app/app.test.service';

export const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
export const today = moment().format('YYYY-MM-DD');
export const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

class _ReportService extends TestService {
  static MCapSum = db.MonthlyCapitationSum;

  static findAllMCaps() {
    return this.MCapSum.findAll({});
  }
}

export default _ReportService;
