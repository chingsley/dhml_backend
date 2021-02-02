import { Joi, validateSchema } from '../../validators/joi/config';
import { Cypher } from '../../utils/Cypher';
import { isEmptyObject } from '../../utils/helpers';
import Response from '../../utils/Response';

const { AES_KEY, IV_KEY } = process.env;
const cypher = new Cypher(AES_KEY, IV_KEY);

export default class AppMiddleware {
  static async validateIdParams(req, res, next) {
    try {
      const paramsSchema = Joi.object({
        hcpId: Joi.number().integer().min(1),
        staffId: Joi.number().integer().min(1),
        enrolleeId: Joi.number().integer().min(1),
        userId: Joi.number().integer().min(1),
      });
      await validateSchema(paramsSchema, req.params, 'Invalid Id: ');
      return next();
    } catch (error) {
      Response.handleError('validateIdParams', error, req, res, next);
    }
  }
  static validateImageUpload(req, res, next) {
    try {
      if (req.files) {
        if (Object.keys(req.files).length === 0) {
          return res.status(400).json({ error: 'no images were uploaded' });
        }
        const allowedFormats = ['image/jpeg', 'image/png'];

        const { image } = req.files;
        if (!image) {
          return res.status(400).json({
            error:
              'missing field "image". Image file must be uploaded as field "image"',
          });
        }
        const IMAGE_SIZE_LIMIT = 3000000;
        if (image.size > IMAGE_SIZE_LIMIT) {
          return res.status(400).json({
            error: `cannot upload image greater than ${(
              IMAGE_SIZE_LIMIT / 1000
            ).toString()}KB in size`,
          });
        }
        if (!allowedFormats.includes(image.mimetype)) {
          return res
            .status(415)
            .json({ error: 'image format must be jpeg or png' });
        }
      }
      return next();
    } catch (error) {
      return Response('validateImageUpload', error, req, res, next);
    }
  }

  static decryptRequestBody = async (req, res, next) => {
    try {
      if (isEmptyObject(req.body) || !req.body.data) {
        return next();
      }
      const { data: encryptedData } = req.body;
      const decryptedBody = cypher.decrypt(encryptedData);
      req.body = JSON.parse(decryptedBody);
      return next();
    } catch (error) {
      return Response('decryptRequestBody', error, req, res, next);
    }
  };
}
