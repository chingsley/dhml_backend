import moment from 'moment';
import Response from '../../utils/Response';
import downloadFile from '../../utils/sendDownloads';
import HcpService from './hcp.services';

export default class HcpController {
  static async addNewHcp(req, res, next) {
    try {
      const hcpService = new HcpService(req);
      const data = await hcpService.createHcp();
      return res.status(201).json({ message: 'registration successful', data });
    } catch (error) {
      Response.handleError('addNewHcp', error, req, res, next);
    }
  }
  static async updateHcp(req, res, next) {
    try {
      const hcpService = new HcpService(req);
      const data = await hcpService.updateHcpInfo();
      return res
        .status(200)
        .json({ message: 'record updated successfully', data });
    } catch (error) {
      Response.handleError('updateHcp', error, req, res, next);
    }
  }
  static async getAllHcp(req, res, next) {
    try {
      const hcpService = new HcpService(req);
      const data = await hcpService.fetchAllHcp();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('getAllHcp', error, req, res, next);
    }
  }
  static async getVerifiedHcpEnrollees(req, res, next) {
    try {
      const { user, userType } = req;
      const { hcpId } = req.params;
      if (userType === 'hcp' && `${user.id}` !== `${hcpId}`) {
        return res.status(401).json({
          errors: [
            'Access denied. As an HCP user, you can only view your own enrollees',
          ],
        });
      }
      const hcpService = new HcpService(req);
      const data = await hcpService.fetchVerifiedHcpEnrollees(hcpId);
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('getVerifiedHcpEnrollees', error, req, res, next);
    }
  }

  static async downloadHcpManifest(req, res, next) {
    try {
      const hcpService = new HcpService(req);
      const data = await hcpService.downloadEnrollees();
      const { return_json } = req.headers;
      if (return_json === 'true') {
        return res.status(200).json({ data });
      }
      return await downloadFile(
        res,
        data.rows,
        `manifest_${moment(new Date()).format('YYYY_MM_DD_HH_MM')}.pdf`
      );
    } catch (error) {
      Response.handleError('downloadHcpManifest', error, req, res, next);
    }
  }

  static async printCapitationSummary(req, res, next) {
    try {
      const hcpService = new HcpService(req);
      const data = await hcpService.fetchCapitationSummary();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('printCapitationSummary', error, req, res, next);
    }
  }
  static async getManifest(req, res, next) {
    try {
      const hcpService = new HcpService(req);
      const data = await hcpService.fetchManifest();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('getManifest', error, req, res, next);
    }
  }
  static async getCapitation(req, res, next) {
    try {
      const hcpService = new HcpService(req);
      const data = await hcpService.fetchCapitation();
      return res.status(200).json({ data });
    } catch (error) {
      Response.handleError('getCapitation', error, req, res, next);
    }
  }
  static async changeHcpStatus(req, res, next) {
    try {
      const hcpService = new HcpService(req);
      const data = await hcpService.suspendOrActivate();
      return res
        .status(200)
        .json({ message: 'status successfully update', data });
    } catch (error) {
      Response.handleError('changeHcpStatus', error, req, res, next);
    }
  }
  static async deleteHcp(req, res, next) {
    try {
      const hcpService = new HcpService(req);
      const data = await hcpService.handleHcpDelete();
      return res.status(200).json({ message: 'HCP has been deleted', data });
    } catch (error) {
      Response.handleError('deleteHcp', error, req, res, next);
    }
  }
}
