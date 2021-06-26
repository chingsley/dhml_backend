import { Op } from 'sequelize';
import { SERVICE_STATUS } from '../../shared/constants/lists.constants';
import { days, moment } from '../../utils/timers';
// import NanoId from '../../utils/NanoId';

const codeFactory = {
  async generateReferalCode({ enrolleeServiceStatus, stateCode, specialty }) {
    const date = moment().format('DDMMYY');
    const n = await this.getCodeSerialNo(specialty.id);
    const serviceStatus = enrolleeServiceStatus
      ? enrolleeServiceStatus === SERVICE_STATUS.SERVING
        ? 'S'
        : 'R'
      : 'AD';
    return `${stateCode}/${date}/022/${specialty.code}-${n}/${serviceStatus}`;
  },

  /**
   * get count of same-specialty code requests approved today (using dateApproved);
   * return count+1;
   */
  async getCodeSerialNo(specialtyId) {
    const today12Midnight = new Date(days.today);
    const copy = new Date(days.today);
    const tomorrow12Midnight = new Date(copy.setDate(copy.getDate() + 1));
    const currentCount = await this.ReferalCodeModel.count({
      where: {
        dateApproved: {
          [Op.between]: [today12Midnight, tomorrow12Midnight],
        },
        specialtyId,
      },
    });
    return currentCount + 1;
  },

  // async getProxyCode() {
  //   return NanoId.getValue({
  //     length: 8,
  //     model: this.ReferalCodeModel,
  //     fields: ['proxyCode'],
  //     checkDuplicates: true,
  //   });
  // },
};

export default codeFactory;
