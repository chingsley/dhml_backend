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

  static async getTotalEncounterForGivenMonth(req, res, next) {
    try {
      const encounterService = new EncounterService(req);
      const data = await encounterService.getTotalEncounterForGivenMonthSVC();
      return res.status(201).json({
        message: 'Successful!',
        data,
      });
    } catch (error) {
      Response.handleError(
        'getTotalEncounterForGivenMonth',
        error,
        req,
        res,
        next
      );
    }
  }

  static async getAvgEncounterPerHcpForGivenMonth(req, res, next) {
    try {
      const encounterService = new EncounterService(req);
      const data =
        await encounterService.getAvgEncounterPerHcpForGivenMonthSVC();
      return res.status(201).json({
        message: 'Successful!',
        data,
      });
    } catch (error) {
      Response.handleError(
        'getAvgEncounterPerHcpForGivenMonth',
        error,
        req,
        res,
        next
      );
    }
  }

  static async getTotalReferalRateForGivenMonth(req, res, next) {
    try {
      const encounterService = new EncounterService(req);
      const data = await encounterService.getTotalReferalRateForGivenMonthSVC();
      return res.status(201).json({
        message: 'Successful!',
        data,
      });
    } catch (error) {
      Response.handleError(
        'getTotalReferalRateForGivenMonth',
        error,
        req,
        res,
        next
      );
    }
  }
  static async getAvgCostForGivenMonth(req, res, next) {
    try {
      const encounterService = new EncounterService(req);
      const data = await encounterService.getAvgCostForGivenMonthSVC();
      return res.status(201).json({
        message: 'Successful!',
        data,
      });
    } catch (error) {
      Response.handleError('getAvgCostForGivenMonth', error, req, res, next);
    }
  }
  static async getNhisReturnsForGivenMonth(req, res, next) {
    try {
      const encounterService = new EncounterService(req);
      const data = await encounterService.getNhisReturnsForGivenMonthSVC();
      return res.status(201).json({
        message: 'Successful!',
        data,
      });
    } catch (error) {
      Response.handleError(
        'getNhisReturnsForGivenMonth',
        error,
        req,
        res,
        next
      );
    }
  }
  static async getTop10DiseaseForGivenMonth(req, res, next) {
    try {
      const encounterService = new EncounterService(req);
      const data = await encounterService.getTop10DiseaseForGivenMonthSVC();
      return res.status(201).json({
        message: 'Successful!',
        data,
      });
    } catch (error) {
      Response.handleError(
        'getTop10DiseaseForGivenMonth',
        error,
        req,
        res,
        next
      );
    }
  }
  static async getHcpListForGivenMonth(req, res, next) {
    try {
      const encounterService = new EncounterService(req);
      const data = await encounterService.getHcpListForGivenMonthSVC();
      return res.status(201).json({
        message: 'Successful!',
        data,
      });
    } catch (error) {
      Response.handleError('getHcpListForGivenMonth', error, req, res, next);
    }
  }
}
