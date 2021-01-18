import db from '../../database/models';
import { throwError } from '../../shared/helpers';
import Cloudinary from '../../utils/Cloudinary';
import { zeroPadding, getAvailableIds } from '../../utils/helpers';
import { castIdToInt } from '../../database/scripts/princpal.scripts';
import AppService from '../app/app.service';

export default class EnrolleeService extends AppService {
  constructor(enrolleeData, files) {
    super(enrolleeData, files);
    this.enrolleeData = enrolleeData;
    this.files = files;
  }
  async enrolPrincipal() {
    const enrolleeData = this.enrolleeData;
    const files = this.files;
    await this.validateUnique(['serviceNumber', 'staffNumber'], {
      model: db.Principal,
      reqBody: this.enrolleeData,
      resourceType: 'Principal',
    });

    if (enrolleeData.enrolmentType === 'special-principal') {
      const { id } = enrolleeData;
      await this.validateSpecialPrincipalId(id);
      enrolleeData.id = zeroPadding(id);
    } else {
      enrolleeData.id = await db.Principal.generateNewPrincipalId();
    }
    const uploadedImages = files ? await Cloudinary.bulkUpload(files) : {};
    const enrollee = await db.Principal.createPrincipal({
      ...enrolleeData,
      ...uploadedImages,
    });
    return enrollee;
  }

  async enrolDependant() {
    const dependantData = this.enrolleeData;
    const files = this.files;
    const { principalId } = dependantData;
    const principal = await this.getPrincipalById(principalId, {
      throwErrorIfNotFound: true,
    });
    this.validateDependantScheme(principal.scheme, dependantData.scheme);
    principal.checkDependantLimit(dependantData);
    dependantData.id = principal.generateNewDependantId();
    const uploadedImages = files ? await Cloudinary.bulkUpload(files) : {};
    const data = await db.Dependant.createDependant(
      {
        ...dependantData,
        ...uploadedImages,
      },
      principal
    );
    return data;
  }

  async getAllEnrollees() {}

  async getPrincipalById(id, { throwErrorIfNotFound }) {
    const principal = await db.Principal.findOneWhere(
      { id },
      {
        throwErrorIfNotFound,
        errorMsg: `Invalid principal enrolment ID. No record found for ID ${id}`,
        errorCode: 'E001',
        include: [
          { model: db.Dependant, as: 'dependants' },
          {
            model: db.HealthCareProvider,
            as: 'hcp',
            attributes: ['code', 'name'],
          },
        ],
      }
    );
    return principal;
  }

  async validateSpecialPrincipalId(id) {
    if (Number(id) < 1 || Number(id) > 230) {
      const errorMsg =
        'Invalid Special Enrolment ID, allowed values must be in the range 1 - 230';
      throwError({
        status: 400,
        error: [errorMsg],
      });
    }
    const { dialect } = db.sequelize.options;
    const specialPrincipalIds = await db.Principal.findAll({
      where: db.sequelize.where(
        db.sequelize.literal(castIdToInt(dialect)),
        '<',
        231
      ),
      attributes: [[db.sequelize.literal(castIdToInt(dialect)), 'id']],
      raw: true,
    });
    const usedIDs = specialPrincipalIds.map(({ id }) => id);
    if (usedIDs.includes(Number(id))) {
      const pool = Array.from(Array(231).keys()).slice(1);
      const availableIds = getAvailableIds(pool, usedIDs);
      throwError({
        status: 400,
        error: [
          `The Enrolment ID: ${id} has been taken, please choose from the available list: ${availableIds.join(
            ','
          )}`,
        ],
      });
    }
  }

  validateDependantScheme(prinicpalScheme, dependantScheme) {
    const allowed =
      prinicpalScheme === dependantScheme || dependantScheme === 'VCSHIP';
    if (!allowed) {
      throwError({
        status: 400,
        error: [
          `A principal in ${prinicpalScheme} cannot have a dependant in ${dependantScheme}`,
        ],
      });
    }
    return allowed;
  }
}
