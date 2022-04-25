import { getServiceStatusCode } from '../../utils/helpers';
import { moment } from '../../utils/timers';
import { throwError } from '../../shared/helpers';

const codeFactory = {
  async generateReferalCode(codeData, tryCount = 0) {
    const { enrolleeServiceStatus, stateCode, specialty } = codeData;
    // console.log({ tryCount });
    const date = moment().format('DDMMYY');
    const n = await this.getCodeSerialNo(specialty.code);
    const serviceStatus = getServiceStatusCode(enrolleeServiceStatus);
    const code = `${stateCode}/${date}/022/${specialty.code}-${n}/${serviceStatus}`;
    const duplicateFound = await this.ReferalCodeModel.findByCode(code);
    if (duplicateFound) {
      if (tryCount > 2) {
        this.throwCodeGenerationFailure();
      }
      await this.generateReferalCode(codeData, ++tryCount);
    }
    return code;
  },

  // get count of same-specialty codes generated today
  async getCodeSerialNo(specialtyCode) {
    const { countTodaysCodeBySpecialty: script } = this.refcodeScripts;
    const [{ count }] = await this.executeQuery(script, { specialtyCode });
    return Number(count) + 1;
  },

  throwCodeGenerationFailure() {
    throwError({
      status: 500,
      error: [
        'System busy, cannot generate code at the moment, please try again shortly, REF99',
      ],
    });
  },
};

export default codeFactory;
