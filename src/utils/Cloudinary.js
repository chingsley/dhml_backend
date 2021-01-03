import { v2 as cloudinary } from 'cloudinary';
import moment from 'moment';
const { NODE_ENV } = process.env;
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class Cloudinary {
  static async uploadToCloudinary(image, id) {
    const res = await cloudinary.uploader.upload(image.tempFilePath, {
      public_id: id,
    });
    return res.url;
  }

  static async uploadImage(reqFiles) {
    try {
      const { image } = reqFiles;
      const fileName =
        NODE_ENV === 'test'
          ? image.name
          : `${image.name}_${moment().format('YYYYMMDDHHmmss')}`;
      const imageUrl = await Cloudinary.uploadToCloudinary(
        image,
        `kcportfolio/${fileName}`
      );

      return imageUrl;
    } catch (error) {
      throw new Error(`image upload error: ${error.message || error.error}`);
    }
  }
}

export default Cloudinary;
