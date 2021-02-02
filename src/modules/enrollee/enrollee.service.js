import db from '../../database/models';
import { Op } from 'sequelize';
import { throwError } from '../../shared/helpers';
import Cloudinary from '../../utils/Cloudinary';
import { QueryTypes } from 'sequelize';
import { zeroPadding, getAvailableIds } from '../../utils/helpers';
import { getReservedPrincipalIDs } from '../../database/scripts/enrollee.scripts';
import AppService from '../app/app.service';
import { enrolleeSearchableFields } from '../../shared/attributes/enrollee.attributes';

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
    await this.ensureValidStaffNumber(enrolleeData.staffNumber);
    await this.ensureValidHcpId(enrolleeData.hcpId);
    await this.validateUnique(['serviceNumber', 'staffNumber'], {
      model: db.Enrollee,
      reqBody: this.enrolleeData,
      resourceType: 'Principal',
    });

    if (enrolleeData.enrolmentType === 'special-principal') {
      const { enrolleeIdNo } = enrolleeData;
      await this.validateSpecialPrincipalId(enrolleeIdNo);
      enrolleeData.enrolleeIdNo = zeroPadding(enrolleeIdNo);
    } else {
      enrolleeData.enrolleeIdNo = await db.Enrollee.generateNewPrincipalIdNo();
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
    await this.ensureValidHcpId(dependantData.hcpId);
    const { principalId: principalEnrolleeIdNo } = dependantData;
    const principal = await this.getByEnrolleeIdNo(principalEnrolleeIdNo, {
      throwErrorIfNotFound: true,
    });
    dependantData.principalId = principal.id;
    this.validateDependantScheme(principal.scheme, dependantData.scheme);
    principal.checkDependantLimit(dependantData);
    principal.checkSpouseLimit(dependantData);
    dependantData.enrolleeIdNo = principal.generateNewDependantIdNo();
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
    return db.Enrollee.findAndCountAll({
      where: {
        ...this.searchEnrolleesBy(enrolleeSearchableFields),
        ...this.exactMatch(['isVerified']),
      },
      ...this.paginate(),
      order: [['createdAt', 'DESC']],
      include: {
        model: db.HealthCareProvider,
        as: 'hcp',
      },
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
    const fls = this.files;
    const enrollee = await this.findWithReqParams();
    const { dependants, ...rest } = this.body;
    if (dependants.length > 0) {
      await this.updateDependants(dependants);
    }
    const uploadedImages = fls ? await Cloudinary.bulkUpload(fls) : {};
    await enrollee.update({ ...rest, uploadedImages });
    await enrollee.reload();
    return enrollee;
  }

  async updateDependants(dependants) {
    const promiseArr = dependants.map(({ id, ...rest }) =>
      db.Enrollee.update({ ...rest }, { where: { id } })
    );
    await Promise.all(promiseArr);
  }

  async toggleEnrolleeVerification() {
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
    const enrollee = await this.findWithReqParams();
    await enrollee.destroy();
    return enrollee;
  }

  async findWithReqParams() {
    const { enrolleeId: id } = this.params;
    const options = { throwErrorIfNotFound: true };
    return await this.getByEnrolleeIdNo(id, options);
  }

  async getByEnrolleeIdNo(enrolleeIdNo, { throwErrorIfNotFound }) {
    const enrollee = await db.Enrollee.findOneWhere(
      { enrolleeIdNo },
      {
        throwErrorIfNotFound,
        errorMsg: `Invalid Enrollee ID number. No record found for EnrolleeIdNo.: ${enrolleeIdNo}`,
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

  async validateSpecialPrincipalId(enrolleeIdNo) {
    if (Number(enrolleeIdNo) < 1 || Number(enrolleeIdNo) > 230) {
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
    // the Number(enrolleeIdNo) in next line is not necessary b/c the
    // query(check the script file) already casts the id to integer
    const usedIDs = specialPrincipalIds.map(({ enrolleeIdNo }) =>
      Number(enrolleeIdNo)
    );
    if (usedIDs.includes(Number(enrolleeIdNo))) {
      const pool = Array.from(Array(231).keys()).slice(1);
      const availableIds = getAvailableIds(pool, usedIDs);
      throwError({
        status: 400,
        error: [
          `The Enrolment ID: ${enrolleeIdNo} has been taken, please choose from the available list: ${availableIds.join(
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
