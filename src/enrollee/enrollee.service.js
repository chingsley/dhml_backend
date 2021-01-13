import db from '../database/models';
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

  static async enrolDependant(dependantData) {
    const { principalId } = dependantData;
    const principal = await db.Enrollee.findBy('id', principalId, {
      isRequied: true,
    });
    // upload documents and get url
    // assign url to enrollee photograph, birthCert, etc
    const data = await principal.addDependant(dependantData);
    return data;
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
            error: `An enrollee with ${field}: ${enrolleeData[field]} already exists`,
          });
        }
      }
    }
  }

  static stringify(arrayValue) {
    return JSON.stringify(arrayValue);
  }
}
