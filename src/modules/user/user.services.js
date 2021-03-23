import db from '../../database/models';
import { throwError } from '../../shared/helpers';

import AppService from '../app/app.service';

const { sequelize } = db;

export default class UserService extends AppService {
  constructor({ body, files, query, params }) {
    super({ body, files, query, params });
    this.userData = body;
    this.files = files;
    this.query = query;
    this.params = params;
  }

  async createUser() {
    const t = await sequelize.transaction();
    try {
      const { staffId, roleId, returnPassword } = this.userData;
      // const staff = await this.validateStaffId(staffId);
      const staff = await this.validateId('Staff', staffId);
      this.rejectStaffWithoutEmail(staff);
      await this.validateRoleId(roleId); // move to appService
      await this.checkUserUniqueViolations();
      const user = await db.User.create(this.userData, { transaction: t });
      const defaultPass = await this.createDefaultPassword(
        { userId: user.id },
        {
          transaction: t,
        }
      );
      const result = user.dataValues;
      result.defaultPassword = returnPassword && defaultPass;
      await this.sendPassword(staff.email, defaultPass);
      await t.commit();
      return result;
    } catch (error) {
      await t.rollback();
      throw error;
      // or
      // throw new Error(error.message);
    }
  }
  rejectStaffWithoutEmail = (staff) => {
    const { surname, email, staffIdNo } = staff;
    if (!email) {
      throwError({
        status: 400,
        error: [
          `The staff ${surname} with staff ID NO. ${staffIdNo} does not have an email. Staff email is required for all users`,
        ],
      });
    }
  };

  fetchAllUsers = () => {
    return db.User.findAndCountAll({
      attributes: { exclude: ['password'] },
      where: {
        ...this.filterBy(['username', 'email'], { modelName: 'User' }),
      },
      order: [['createdAt', 'DESC']],
      ...this.paginate(),
      include: [
        { model: db.Role, as: 'role', attributes: ['id', 'title'] },
        {
          model: db.Staff,
          as: 'staffInfo',
          where: {
            ...this.filterBy(['firstName', 'surname', 'middleName'], {
              modelName: 'Staff',
            }),
          },
        },
      ],
    });
  };

  async editUserInfo() {
    const { userId } = this.params;
    await this.checkUserUniqueViolations(userId);
    const user = await this.findUserById(userId);
    await user.update(this.body);
    await user.reload({
      include: [
        { model: db.Role, as: 'role' },
        { model: db.Staff, as: 'staffInfo' },
      ],
    });
    return user;
  }

  async handleUserDelete() {
    const { userIds } = this.body;
    await db.User.destroy({ where: { id: userIds } });
  }

  async findUserById(userId) {
    return await this.findOneRecord({
      modelName: 'User',
      where: { id: userId },
      include: [{ model: db.Role, as: 'role' }],
      isRequired: true,
      errorIfNotFound: `Invalid userId. No user found for id.: ${userId}`,
    });
  }

  async validateRoleId(roleId) {
    const errorMsg = `Role with id: ${roleId} does not exist`;
    const options = { thowErrorIfNotFound: true, errorMsg };
    await db.Role.findOneWhere({ id: roleId }, options);
  }

  async checkUserUniqueViolations(userId) {
    await this.validateUnique(['staffId'], {
      resourceType: 'User',
      model: db.User,
      reqBody: this.userData,
      nonStringDataTypes: ['staffId'],
      resourceId: Number(userId),
    });
  }
}
