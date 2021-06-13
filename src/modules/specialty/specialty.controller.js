import Response from '../../utils/Response';
import SpecialistService from './specialty.services';

export default class SpecialistController {
  static async getAllSpecialists(req, res, next) {
    try {
      let data;
      const specialistService = new SpecialistService(req);
      data = await specialistService.getAllSpecialistsSVC();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('getAllSpecialists', error, req, res, next);
    }
  }
}
