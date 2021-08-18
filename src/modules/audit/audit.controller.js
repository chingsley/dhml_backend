import Response from '../../utils/Response';
import AuditLogService from './audit.services';

export default class AuditLogController {
  static async getAuditLogs(req, res, next) {
    try {
      const auditLogService = new AuditLogService(req);
      const data = await auditLogService.getAuditLogsService();
      return res.status(200).json({
        data,
      });
    } catch (error) {
      Response.handleError('getAuditLogs', error, req, res, next);
    }
  }
}
