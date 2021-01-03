import UserService from './user.services';
import AppController from '../app/app.controller';
import Jwt from '../utils/Jwt';
import db from '../database/models';

const { sequelize } = db;

export default class UserController extends AppController {
  static async registerUser(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const userService = new UserService(req, res);
      const user = await userService.createUser(t);
      await t.commit();
      return res.status(201).json({
        message: 'account successfully created',
        data: {
          user: { ...user.dataValues, password: undefined },
          token: Jwt.generateToken(user),
        },
      });
    } catch (error) {
      await t.rollback();
      UserController.handleError(error, req, res, next);
    }
  }

  static async getAllUsers(req, res, next) {
    try {
      const userService = new UserService(req, res);
      const data = await userService.fetchAllUsers();
      return res.status(200).json({
        message: 'successful',
        data,
      });
    } catch (error) {
      UserController.handleError(error, req, res, next);
    }
  }
}
