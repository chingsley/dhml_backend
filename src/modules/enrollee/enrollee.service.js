import db from '../../database/models';
import { throwError } from '../../shared/helpers';
import Cloudinary from '../../utils/Cloudinary';
import { QueryTypes } from 'sequelize';
import { zeroPadding, getAvailableIds } from '../../utils/helpers';
import { getReservedPrincipalIDs } from '../../database/scripts/enrollee.scripts';
import AppService from '../app/app.service';

export default class EnrolleeService extends AppService {
  constructor({ body, files, query }) {
    super({ body, files, query });
    this.enrolleeData = body;
    this.files = files;
    this.query = query;
  }
  async enrolPrincipal() {
    const enrolleeData = this.enrolleeData;
    const files = this.files;
    await this.validateUnique(['serviceNumber', 'staffNumber'], {
      model: db.Enrollee,
      reqBody: this.enrolleeData,
      resourceType: 'Principal',
    });

    if (enrolleeData.enrolmentType === 'special-principal') {
      const { id } = enrolleeData;
      await this.validateSpecialPrincipalId(id);
      enrolleeData.id = zeroPadding(id);
    } else {
      enrolleeData.id = await db.Enrollee.generateNewPrincipalId();
    }
    const uploadedImages = files ? await Cloudinary.bulkUpload(files) : {};
    const enrollee = await db.Enrollee.createPrincipal({
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
    const data = await db.Enrollee.createDependant(
      {
        ...dependantData,
        ...uploadedImages,
      },
      principal
    );
    return data;
  }

  async getAllEnrollees() {
    return await db.Enrollee.findAndCountAll({
      ...this.paginate(),
    });
  }

  async getPrincipalById(id, { throwErrorIfNotFound }) {
    const principal = await db.Enrollee.findOneWhere(
      { id },
      {
        throwErrorIfNotFound,
        errorMsg: `Invalid principal enrolment ID. No record found for ID ${id}`,
        errorCode: 'E001',
        include: [
          { model: db.Enrollee, as: 'dependants' },
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
    const specialPrincipalIds = await db.sequelize.query(
      getReservedPrincipalIDs(dialect),
      {
        type: QueryTypes.SELECT,
      }
    );
    // the Number(id) in next line is not necessary b/c the
    // query(check the script file) already casts the id to integer
    const usedIDs = specialPrincipalIds.map(({ id }) => Number(id));
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
