import db from '../../database/models';
import NanoId from '../../utils/NanoId';
import NodeMailer from '../../utils/NodeMailer';
import { passwordMsgTemplate } from '../../utils/templates/forPassword';
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
      await this.validateUnique(['email', 'staffId'], {
        resourceType: 'User',
        model: db.User,
        reqBody: this.userData,
      });
      const user = await db.User.create(this.userData, { transaction: t });
      const defaultPass = await this.generateDefaultPwd();
      await db.Password.create(
        { value: this.hashPassword(defaultPass), userId: user.id },
        { transaction: t }
      );
      const result = user.dataValues;
      if (returnPassword) {
        result.defaultPassword = defaultPass;
      } else {
        await NodeMailer.sendMail({
          subject: 'INTEGRATED HEALTH MANAGEMENT SYSTEM',
          emails: user.email,
          html: passwordMsgTemplate(defaultPass),
          notificationType: 'password',
        });
      }
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
    // return { testing: true };
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

  async generateDefaultPwd() {
    const pool =
      '123456789ABCDEFGHJKLMNQRSTUVWXYZabcdefghijkmnoqrstuvwxyz*$#@!^_-+&';
    return await NanoId.getValue({ length: 8, pool });
  }

  async validateRoleId(roleId) {
    const errorMsg = `Role with id: ${roleId} does not exist`;
    const options = { thowErrorIfNotFound: true, errorMsg };
    await db.Role.findOneWhere({ id: roleId }, options);
  }
}
