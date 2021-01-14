import db from '../database/models';
import { Op } from 'sequelize';
import { throwError } from '../shared/helpers';
import Cloudinary from '../utils/Cloudinary';

export default class EnrolleeService {
  static async enrolPrincipal(enrolleeData, files) {
    await this.validateUniqueFields(enrolleeData);
    const uploadedImages = files ? await Cloudinary.bulkUpload(files) : {};
    const enrollee = await db.Enrollee.createPrincipal({
      ...enrolleeData,
      ...uploadedImages,
    });
    await enrollee.reload({
      include: [
        {
          model: db.HealthCareProvider,
          as: 'hcp',
          attributes: ['code', 'name'],
        },
      ],
    });
    return enrollee;
  }

  static async enrolDependant(dependantData, files) {
    await this.validateUniqueFields(dependantData);
    const { principalId } = dependantData;
    const principal = await this.getPrincipalById(principalId, {
      throwErrorIfNotFound: true,
    });
    this.validateDependantScheme(principal.scheme, dependantData.scheme);
    principal.checkDependantLimit(dependantData);
    dependantData.id = principal.generateDependantId();
    dependantData.dependantClass =
      principal.scheme === dependantData.scheme
        ? 'same-scheme-dependant'
        : 'other-scheme-dependant';
    dependantData.dependantType = `${principal.scheme}-TO-${dependantData.scheme}`;
    const uploadedImages = files ? await Cloudinary.bulkUpload(files) : {};
    const data = await principal.addDependant({
      ...dependantData,
      ...uploadedImages,
    });
    return data;
  }

  static async getPrincipalById(id, { throwErrorIfNotFound }) {
    const principal = await db.Enrollee.findOneWhere(
      { id, principalId: { [Op.is]: null } }, // only dependenants have a value for column principalId
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

  static async validateUniqueFields(enrolleeData, enrolleeId) {
    const uniqueFields = ['serviceNumber', 'staffNumber'];
    for (let field of uniqueFields) {
      if (enrolleeData[field]) {
        const found = await db.Enrollee.findOne({
          where: { [field]: enrolleeData[field] },
        });
        if (found && found.id !== enrolleeId) {
          throwError({
            status: 400,
            error: [
              `An enrollee with ${field}: ${enrolleeData[field]} already exists`,
            ],
          });
        }
      }
    }
  }

  static validateDependantScheme(prinicpalScheme, dependantScheme) {
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
