import db from '../../database/models';
import NanoId from '../../utils/NanoId';
import AppService from '../app/app.service';

const { sequelize } = db;

export default class UserService extends AppService {
  constructor(userData) {
    super(userData);
    this.userData = userData;
  }

  async createUser() {
    const t = await sequelize.transaction();
    try {
      const { staffIdNo } = this.userData;
      await this.validateStaffIdNo(staffIdNo);
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
      // [send user password to mail, or return it in response depending on the settings]
      await t.commit();
      return user;
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
        ...this.filterBy(['firstName', 'lastName', 'username', 'email']),
      },
      ...this.paginate(),
      include: [
        { model: db.Role, as: 'role', attributes: ['name'] },
        { model: db.Project, as: 'projects' },
      ],
    });
  };

  async generateDefaultPwd() {
    const pool =
      '123456789ABCDEFGHJKLMNQRSTUVWXYZabcdefghijkmnoqrstuvwxyz*$#@!^_-+&';
    return await NanoId.getValue({ length: 8, pool });
  }

  // rejectDuplicateEmail = async (email) => {
  //   const user = await this.findBy('email', email);
  //   if (user && `${this.req.params.id}` !== `${user.id}`) {
  //     this.throwError({
  //       status: 409,
  //       err: `email ${email} already exists. Duplicate email is not allowed`,
  //     });
  //   }
  // };

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
