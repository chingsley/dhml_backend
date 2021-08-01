import { rejectIf } from '../../shared/helpers';
import Response from '../../utils/Response';
import EnrolleeService from '../enrollee/enrollee.service';
// import EncounterService from './encounter.services';

export default class EncounterController {
  static async recordEncounterCTRL(req, res, next) {
    try {
      const { enrolleeIdNo, ...newEnrolleeData } = req.body;
      // Ensure that only hcp's can create encounter; otherwise req.user.id wil
      // errorneously be a userId instead of hcpId
      rejectIf(req.userType !== 'hcp', {
        withError: 'Only HCPs are allowed to record encounter. ENC001',
        status: 401,
      });
      const requestingHcp = req.user;
      newEnrolleeData.hcpId = requestingHcp.id;

      // const encounterService = new EncounterService(req);
      const enrolleeService = new EnrolleeService(req);
      let enrollee;
      if (!enrolleeIdNo) {
        enrollee = await enrolleeService.registerNewEnrollee(newEnrolleeData);
        req.body.enrolleeIdNo = enrollee.enrolleeIdNo;
        req.body.enrolleeId = enrollee.id;
      }
      // const data = await encounterService.createEncounter(req.body);
      return res.status(201).json({
        message: 'Request for Referral Code has been successfully sent',
        enrollee,
        // data,
      });
    } catch (error) {
      Response.handleError('createEncounterCTRL', error, req, res, next);
    }
  }
}
