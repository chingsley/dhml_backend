import { rejectIf } from '../../shared/helpers';
import Response from '../../utils/Response';
import EnrolleeService from '../enrollee/enrollee.service';
import EncounterService from './encounter.services';

export default class EncounterController {
  static async recordEncounterCTRL(req, res, next) {
    try {
      // Ensure that only hcp's can create encounter; otherwise req.user.id will
      // errorneously be a userId instead of hcpId
      rejectIf(req.userType !== 'hcp', {
        withError: 'Only HCPs are allowed to record encounter. ENC001',
        status: 401,
      });
      const requestingHcp = req.user;
      req.body.hcpId = requestingHcp.id;

      let enrollee;
      const enrolleeService = new EnrolleeService(req);
      const { enrolleeIdNo, ...newEnrolleeData } = req.body;
      if (enrolleeIdNo) {
        enrollee = await enrolleeService.getByEnrolleeIdNo(enrolleeIdNo);
      } else {
        enrollee = await enrolleeService.registerNewEnrollee(newEnrolleeData);
      }
      req.body.enrolleeId = enrollee.id;

      const encounterService = new EncounterService(req);
      const data = await encounterService.recordEncounterSVC(req.body);
      return res.status(201).json({
        message: 'Successful!',
        data,
      });
    } catch (error) {
      Response.handleError('recordEncounterCTRL', error, req, res, next);
    }
  }

  static async getEncounterStats(req, res, next) {
    try {
      const encounterService = new EncounterService(req);
      const data = await encounterService.getEncounterStatsSVC();
      return res.status(201).json({
        message: 'Successful!',
        data,
      });
    } catch (error) {
      Response.handleError('getEncounterStats', error, req, res, next);
    }
  }
}
