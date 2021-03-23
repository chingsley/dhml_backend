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
  static async uploadEnrollees(req, res, next) {
    try {
      const enrolleeService = new EnrolleeService(req);
      const { enrollees } = req.body;
      const result = await enrolleeService.handleBulkUpload();
      return res.status(200).json({ result, enrollees });
    } catch (error) {
      Response.handleError('uploadEnrollees', error, req, res, next);
    }
  }
  static async getEnrollees(req, res, next) {
    try {
      const enrolleeService = new EnrolleeService(req);
      const data = await enrolleeService.getAllEnrollees();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('getEnrollees', error, req, res, next);
    }
  }
  static async getByEnrolleeId(req, res, next) {
    try {
      const enrolleeService = new EnrolleeService(req);
      const data = await enrolleeService.getById();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('getByEnrolleeId', error, req, res, next);
    }
  }

  static async updateEnrollee(req, res, next) {
    try {
      const enrolleeService = new EnrolleeService(req);
      const data = await enrolleeService.updateEnrolleeData();
      return res.status(200).json({ message: 'Operation sucessful', data });
    } catch (error) {
      Response.handleError('updateEnrollee', error, req, res, next);
    }
  }
  static async verifyEnrollee(req, res, next) {
    try {
      const enrolleeService = new EnrolleeService(req);
      const data = await enrolleeService.verifyEnrollee();
      return res.status(200).json({ message: 'Operation successful', data });
    } catch (error) {
      Response.handleError('verifyEnrollee', error, req, res, next);
    }
  }
  static async unverifyEnrollee(req, res, next) {
    try {
      const enrolleeService = new EnrolleeService(req);
      const data = await enrolleeService.unverifyEnrollee();
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
