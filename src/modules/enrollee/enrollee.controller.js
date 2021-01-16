import Response from '../../utils/Response';
import EnrolleeService from './enrollee.service';

export default class EnrolleeController {
  static async addNewEnrollee(req, res, next) {
    try {
      const { enrolmentType } = req.body;
      const enrolleeService = new EnrolleeService(req.body, req.files);
      const enrollee = enrolmentType.match(/principal/i)
        ? await enrolleeService.enrolPrincipal()
        : await enrolleeService.enrolDependant();
      // const enrollee = enrolmentType.match(/principal/i)
      //   ? await EnrolleeService.enrolPrincipal(req.body, req.files)
      //   : await EnrolleeService.enrolDependant(req.body, req.files);
      return res.status(201).json({ data: enrollee });
    } catch (error) {
      Response.handleError('EnrolleeController', error, req, res, next);
    }
  }
}
