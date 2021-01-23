import db from '../../database/models';
import { Op } from 'sequelize';
import { throwError } from '../../shared/helpers';
import Cloudinary from '../../utils/Cloudinary';
import { QueryTypes } from 'sequelize';
import { zeroPadding, getAvailableIds } from '../../utils/helpers';
import { getReservedPrincipalIDs } from '../../database/scripts/enrollee.scripts';
import AppService from '../app/app.service';
import enrolleeAttributes from '../../shared/attributes/enrollee.attributes';

export default class EnrolleeService extends AppService {
  constructor({ body, files, query, params }) {
    super({ body, files, query, params });
    this.enrolleeData = body;
    this.files = files;
    this.query = query;
    this.params = params;
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
    const principal = await this.getEnrolleeById(principalId, {
      throwErrorIfNotFound: true,
    });
    this.validateDependantScheme(principal.scheme, dependantData.scheme);
    principal.checkDependantLimit(dependantData);
    dependantData.id = principal.generateNewDependantId();
    const uploadedImages = files ? await Cloudinary.bulkUpload(files) : {};
    const data = await db.Enrollee.createDependant(
      {
        ...dependantData,
        hcpId: dependantData.hcpId || principal.hcpId,
        ...uploadedImages,
      },
      principal
    );
    return data;
  }

  async getAllEnrollees() {
    return await db.Enrollee.findAndCountAll({
      where: {
        ...this.filterBy(enrolleeAttributes.personalData, {
          modelName: 'Enrollee',
        }),
      },
      order: [['createdAt', 'DESC']],
      ...this.paginate(),
      include: [
        {
          model: db.HealthCareProvider,
          as: 'hcp',
          where: {
            ...this.filterBy(['hcpName', 'hcpCode'], {
              modelName: 'HealthCareProvider',
              map: {
                hcpName: 'name',
                hcpCode: 'code',
              },
            }),
          },
        },
      ],
    });
  }
  getById() {
    return db.Enrollee.findAll({
      where: {
        id: this.params.enrolleeId,
      },
      include: [
        {
          model: db.HealthCareProvider,
          as: 'hcp',
        },
        {
          model: db.Enrollee,
          as: 'dependants',
          include: {
            model: db.HealthCareProvider,
            as: 'hcp',
          },
        },
      ],
    });
  }

  async updateEnrolleeData() {
    // const { enrolleeId: id } = this.params;
    // const options = { throwErrorIfNotFound: true };
    // const enrollee = await this.getEnrolleeById(id, options);
    const fls = this.files;
    const enrollee = await this.findWithReqParams();
    const uploadedImages = fls ? await Cloudinary.bulkUpload(fls) : {};
    await enrollee.update({ ...this.body, uploadedImages });
    return enrollee;
  }

  async toggleEnrolleeVerification() {
    // const { enrolleeId: id } = this.params;
    // const options = { throwErrorIfNotFound: true };
    // const enrollee = await this.getEnrolleeById(id, options);
    const enrollee = await this.findWithReqParams();
    await enrollee.update({ isVerified: !enrollee.isVerified });
    if (enrollee.principalId === null) {
      const dependantIds = enrollee.dependants.map((depndt) => depndt.id);
      await db.Enrollee.update(
        { isVerified: !enrollee.isVerified },
        { where: { id: { [Op.in]: dependantIds } } }
      );
    }
    return enrollee;
  }

  async destroyEnrollee() {
    // const { enrolleeId: id } = this.params;
    // const options = { throwErrorIfNotFound: true };
    // const enrollee = await this.getEnrolleeById(id, options);
    const enrollee = await this.findWithReqParams();
    await enrollee.destroy();
    return enrollee;
  }

  async findWithReqParams() {
    const { enrolleeId: id } = this.params;
    const options = { throwErrorIfNotFound: true };
    return await this.getEnrolleeById(id, options);
  }

  async getEnrolleeById(id, { throwErrorIfNotFound }) {
    const enrollee = await db.Enrollee.findOneWhere(
      { id },
      {
        throwErrorIfNotFound,
        errorMsg: `Invalid Enrollee ID. No record found for ID ${id}`,
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
    return enrollee;
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
    const { dialect, database } = db.sequelize.options;
    const specialPrincipalIds = await db.sequelize.query(
      getReservedPrincipalIDs(dialect, database),
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
