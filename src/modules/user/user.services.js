import db from '../../database/models';

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
      await this.validateStaffId(staffId);
      await this.validateRoleId(roleId); // define in appService
      await this.checkUniqueViolations();
      const user = await db.User.create(this.userData, { transaction: t });
      const defaultPass = await this.createDefaultPassword(
        { userId: user.id },
        {
          transaction: t,
        }
      );
      const result = user.dataValues;
      result.defaultPassword = returnPassword && defaultPass;
      await this.sendPassword(user.email, defaultPass);
      await t.commit();
      return result;
    } catch (error) {
      await t.rollback();
      throw error;
      // or
      // throw new Error(error.message);
    }
  }

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
    await this.checkUniqueViolations(userId);
    const user = await this.findUserById(userId);
    await user.update(this.body);
    await user.reload({ include: { model: db.Role, as: 'role' } });
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

  async checkUniqueViolations(userId) {
    await this.validateUnique(['email', 'staffId'], {
      resourceType: 'User',
      model: db.User,
      reqBody: this.userData,
      resourceId: Number(userId),
    });
  }
}
