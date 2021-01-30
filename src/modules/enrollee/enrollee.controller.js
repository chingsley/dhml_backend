import Response from '../../utils/Response';
import EnrolleeService from './enrollee.service';

export default class EnrolleeController {
  static async addNewEnrollee(req, res, next) {
    try {
      const { enrolmentType } = req.body;
      const enrolleeService = new EnrolleeService(req);
      const enrollee = enrolmentType.match(/principal/i)
        ? await enrolleeService.enrolPrincipal()
        : await enrolleeService.enrolDependant();
      return res
        .status(201)
        .json({ message: 'Data successfully saved', data: enrollee });
    } catch (error) {
      Response.handleError('addNewEnrollee', error, req, res, next);
    }
  }
  static async getEnrollees(req, res, next) {
    try {
      const enrolleeService = new EnrolleeService(req);
      const data = await enrolleeService.getAllEnrollees();
      return res.status(201).json({ data });
    } catch (error) {
      Response.handleError('getEnrollees', error, req, res, next);
    }
  }
  static async getByEnrolleeId(req, res, next) {
    try {
      const enrolleeService = new EnrolleeService(req);
      const data = await enrolleeService.getById();
      return res.status(201).json({ data });
    } catch (error) {
      Response.handleError('getEnrollees', error, req, res, next);
    }
  }

  static async updateEnrollee(req, res, next) {
    try {
      const enrolleeService = new EnrolleeService(req);
      const data = await enrolleeService.updateEnrolleeData();
      return res.status(201).json({ message: 'Operation sucessful', data });
    } catch (error) {
      Response.handleError('getEnrollees', error, req, res, next);
    }
  }
  static async verifyEnrollee(req, res, next) {
    try {
      const enrolleeService = new EnrolleeService(req);
      const data = await enrolleeService.toggleEnrolleeVerification();
      return res.status(200).json({ message: 'Operation successful', data });
    } catch (error) {
      Response.handleError('verifyEnrollee', error, req, res, next);
    }
  }
  static async deleteEnrollee(req, res, next) {
    try {
      const enrolleeService = new EnrolleeService(req);
      const data = await enrolleeService.destroyEnrollee();
      return res.status(200).json({ message: 'Operation successful', data });
    } catch (error) {
      Response.handleError('deleteEnrollee', error, req, res, next);
    }
  }
}
