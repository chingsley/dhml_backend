import { Op } from 'sequelize';
import { days, moment } from '../../utils/timers';
import NanoId from '../../utils/NanoId';

const codeFactory = {
  async getReferalCode(enrollee, stateCode, specialistCode) {
    const date = moment().format('DDMMYY');
    const n = await this.getCodeSerialNo(specialistCode);
    // NOTE: computing the serviceStatus is not concluded;for dsship and dependants
    // with serviceStatus null, how do we handle those? for now, they'll default to 'R'
    const serviceStatus = enrollee.serviceStatus === 'serving' ? 'S' : 'R';
    return `${stateCode}/${date}/022/${specialistCode}-${n}/${serviceStatus}`;
  },

  /**
   * get count of code generated today (using createdAt);
   * return count+1;
   */
  async getCodeSerialNo(specialistCode) {
    const today12Midnight = new Date(days.today);
    const copy = new Date(days.today);
    const tomorrow12Midnight = new Date(copy.setDate(copy.getDate() + 1));
    const currentCount = await this.ReferalCodeModel.count({
      where: {
        createdAt: {
          [Op.between]: [today12Midnight, tomorrow12Midnight],
        },
        specialistCode,
      },
    });
    return currentCount + 1;
  },

  async getProxyCode() {
    return NanoId.getValue({
      length: 8,
      model: this.ReferalCodeModel,
      fields: ['proxyCode'],
      checkDuplicates: true,
    });
  },
};

export default codeFactory;
