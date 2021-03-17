import { throwError } from '../../shared/helpers';
import { validateSchema } from '../../validators/joi/config';
import { serviceNumRegex } from '../../validators/regex/svn.regex';

const {
  enrolleeValidatorSchemas: schemas,
} = require('../../validators/joi/schemas/helpers.schemas');

const enrolleeValidators = {
  async validateAfshipPrincipal(enrollee) {
    const { joiFormatted } = await validateSchema(
      schemas.afshipPrincipal,
      this.getEnrolleeKeyInfo(enrollee)
    );
    this.validateRank(joiFormatted);
    this.validateServiceNumber(joiFormatted);
  },

  async validateDsshipPrincipal(enrollee) {
    await validateSchema(
      schemas.dsshipPrincipal,
      this.getEnrolleeKeyInfo(enrollee)
    );
  },

  async validateDependant(enrollee) {
    await validateSchema(schemas.dependant, this.getEnrolleeKeyInfo(enrollee));
  },

  validateRank({ armOfService, rank }) {
    if (!serviceNumRegex[armOfService][rank]) {
      throwError({
        status: 400,
        errors: [`${rank} is not a valid rank in the ${armOfService}`],
      });
    }
  },

  validateServiceNumber({ armOfService, rank, serviceNumber }) {
    if (!serviceNumber.match(serviceNumRegex[armOfService][rank])) {
      throwError({
        status: 400,
        errors: [
          `${serviceNumber} is not a valid service number for rank ${rank} in the ${armOfService}`,
        ],
      });
    }
  },

  getEnrolleeKeyInfo(enrollee) {
    const frmt = (value) => value || undefined;
    return {
      serviceNumber: frmt(enrollee.serviceNumber),
      armOfService: frmt(enrollee.armOfService),
      rank: frmt(enrollee.rank),
      staffNumber: frmt(enrollee.staffNumber),
    };
  },
};

export default enrolleeValidators;
