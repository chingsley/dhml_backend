import { v2 as cloudinary } from 'cloudinary';
import moment from 'moment';
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
      const fileName = `${image.name.replace('.', '_')}_${moment().format(
        'YYYYMMDDHHmmss'
      )}`;
      const imageUrl = await Cloudinary.uploadToCloudinary(
        image,
        `dhml/${fileName}`
      );

      return imageUrl;
    } catch (error) {
      throw new Error(`image upload error: ${error.message || error.error}`);
    }
  }

  static async bulkUpload(filesObject) {
    const promiseArr = Object.entries(filesObject).map(([field, file]) => {
      const fileName = `${file.name.replace('.', '_')}_${moment().format(
        'YYYYMMDDHHmmss'
      )}`;
      const path = `dhml/${field}`;
      return this.uploadToCloudinary(file, `${path}/${fileName}`);
    });

    const result = await Promise.all(promiseArr);
    return result.reduce((objToBeReturned, url) => {
      for (let field of Object.keys(filesObject)) {
        if (url.includes(`/${field}/`)) {
          objToBeReturned[field] = url;
        }
      }
      return objToBeReturned;
    }, {});
  }
}

export default Cloudinary;
