import Response from '../utils/Response';
import EnrolleeService from './enrollee.service';

export default class EnrolleeController {
  static async addNewEnrollee(req, res, next) {
    try {
      const { enrolmentType } = req.body;

      const enrollee =
        enrolmentType === 'principal'
          ? await EnrolleeService.enrolPrincipal(req.body, req.files)
          : await EnrolleeService.enrolDependant(req.body, req.files);
      return res.status(201).json({ data: enrollee });
    } catch (error) {
      Response.handleError('EnrolleeController', error, req, res, next);
    }
  }
}
