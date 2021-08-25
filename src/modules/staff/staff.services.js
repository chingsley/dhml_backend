import { QueryTypes } from 'sequelize';
import db from '../../database/models';
import { getUnregisteredStaffs } from '../../database/scripts/staff.scripts';
import {
  queryAttributes,
  staffSearchableFields,
} from '../../shared/attributes/staff.attributes';
import Cloudinary from '../../utils/Cloudinary';
import AppService from '../app/app.service';

export default class StaffService extends AppService {
  constructor({ body, files, query, params, user: operator }) {
    super({ body, files, query, params, operator });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
    this.operator = operator;
  }

  async createNewStaff() {
    const newStaff = this.body;
    const { staffId: id } = this.params;
    await this.validateStaffUniqueFields(id, newStaff);
    const files = this.files;
    const uploadedImages = files ? await Cloudinary.bulkUpload(files) : {};
    const staff = await db.Staff.create({ ...newStaff, ...uploadedImages });
    this.record(`Created a new staff record. StaffIdNo: ${staff.staffIdNo}`);
    return staff;
  }

  async updateStaffInfo() {
    const staffId = Number(this.params.staffId);
    const changes = this.body;
    const { staffId: id } = this.params;
    await this.validateStaffUniqueFields(id, changes);
    const files = this.files;
    const uploadedImages = files ? await Cloudinary.bulkUpload(files) : {};
    const results = await db.Staff.update(
      { ...changes, ...uploadedImages },
      { where: { id: staffId }, returning: true }
    );
    this.rejectIf(!results[1][0], {
      withError: `no staff record found for id ${staffId}`,
    });
    this.record(`Updated staff record. StaffIdNo: ${results[1][0].staffIdNo}`);
    return results[1][0];
  }

  async validateStaffUniqueFields(staffId, reqBody) {
    return await this.validateUnique(
      ['staffIdNo', 'staffFileNo', 'email', 'accountNumber'],
      {
        model: db.Staff,
        reqBody: reqBody,
        resourceType: 'A staff member',
        resourceId: staffId,
      }
    );
  }

  async fetchAllStaff() {
    const { unregisteredOnly } = this.query;
    if (unregisteredOnly && JSON.parse(unregisteredOnly.toLowerCase())) {
      const { dialect, database } = db.sequelize.options;
      return await db.sequelize.query(
        getUnregisteredStaffs(dialect, database),
        {
          type: QueryTypes.SELECT,
        }
      );
    } else {
      return await db.Staff.findAndCountAll({
        where: {
          ...this.searchRecordsBy(staffSearchableFields),
          ...this.filterBy(queryAttributes),
          ...this.exactMatch(['id', 'staffIdNo', 'email']),
        },
        order: [['createdAt', 'DESC']],
        ...this.paginate(),
      });
    }
  }
}
