import db from '../../database/models';
import NanoId from '../../utils/NanoId';
import NodeMailer from '../../utils/NodeMailer';
import { passwordMsgTemplate } from '../../utils/templates/forPassword';
import AppService from '../app/app.service';

const { sequelize } = db;

export default class UserService extends AppService {
  constructor({ body, files, query }) {
    super({ body, files, query });
    this.userData = body;
    this.files = files;
    this.query = query;
  }

  async createUser() {
    const t = await sequelize.transaction();
    try {
      const { staffIdNo, roleId, returnPassword } = this.userData;
      await this.validateStaffIdNo(staffIdNo);
      await this.validateRoleId(roleId); // define in appService
      await this.validateUnique(['email', 'staffIdNo'], {
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
    return db.User.findAndCountAll({
      attributes: { exclude: ['password'] },
      where: {
        ...this.filterBy(['username', 'email']),
      },
      ...this.paginate(),
      include: [
        { model: db.Role, as: 'role', attributes: ['title'] },
        {
          model: db.Staff,
          as: 'staffInfo',
          where: { ...this.filterBy(['firstName', 'surname', 'middleName']) },
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

  // rejectDuplicateUsername = async (username) => {
  //   const user = await this.findBy('username', username);
  //   if (user && `${this.req.params.id}` !== `${user.id}`) {
  //     this.throwError({
  //       status: 409,
  //       err: `username ${username} already exists. Duplicate username is not allowed`,
  //     });
  //   }
  // };

  findBy = (field, value) => {
    return db.User.findOne({
      where: { [field]: value },
      include: [{ model: db.Role, as: 'role' }],
    });
  };

  // getRoleId = async (roleName) => {
  //   const [role] = await db.Role.findOrCreate({
  //     where: { name: roleName },
  //   });

  //   if (!role) {
  //     throw new Error(`role name ${roleName} does not exist`);
  //   }

  //   return role.id;
  // };
}
