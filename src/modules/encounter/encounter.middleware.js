import Response from '../../utils/Response';
import { validateSchema } from '../../validators/joi/config';
import {
  schemaFristTimeEncounter,
  schemaReturningEncounter,
} from '../../validators/joi/schemas/encounter.schema';

export default class EncounterMiddleware {
  static async validateEncounter(req, res, next) {
    try {
      const { enrolleeIdNo, enrolmentType } = req.body;
      const isReturningVisit = !!enrolleeIdNo;
      const schema = isReturningVisit
        ? schemaReturningEncounter
        : schemaFristTimeEncounter(enrolmentType);
      const { joiFormatted } = await validateSchema(schema, req.body);
      req.body = joiFormatted;
      req.body.isReturningVisit = isReturningVisit;
      return next();
    } catch (error) {
      Response.handleError('validateRequestForRefcode', error, req, res, next);
    }
  }
}
