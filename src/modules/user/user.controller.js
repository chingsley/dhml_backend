import Response from '../../utils/Response';
import UserService from './user.services';

export default class UserController {
  static async registerUser(req, res, next) {
    try {
      const userService = new UserService(req);
      const user = await userService.createUser();
      return res.status(201).json({ message: 'successful', data: user });
    } catch (error) {
      Response.handleError('registerUser', error, req, res, next);
    }
  }

  static async getAllUsers(req, res, next) {
    try {
      const userService = new UserService(req);
      const data = await userService.fetchAllUsers();
      return res.status(200).json({
        message: 'successful',
        data,
      });
    } catch (error) {
      Response.handleError('getAllUsers', error, req, res, next);
    }
  }
}
