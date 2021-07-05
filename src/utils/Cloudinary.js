import { v2 as cloudinary } from 'cloudinary';
import moment from 'moment';
import { throwError } from '../shared/helpers';
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class Cloudinary {
  static async uploadToCloudinary(image, id) {
    try {
      const res = await cloudinary.uploader.upload(image.tempFilePath, {
        public_id: id,
      });
      return res.url;
    } catch (error) {
      throwError({
        status: 500,
        error: [
          'Failed to upload documents, please check your internet connection and try again.',
        ],
      });
    }
  }

  static getMainFolder() {
    return process.env.NODE_ENV === 'production' ? 'dhml' : 'dhml_testing';
  }

  static async uploadImage(image, subFolder = null) {
    try {
      const mainFolder = this.getMainFolder();
      const fileName = `${image.name.replace('.', '_')}_${moment().format(
        'YYYYMMDDHHmmss'
      )}`;
      const path = subFolder
        ? `${mainFolder}/${subFolder}/${fileName}`
        : `${mainFolder}/${fileName}`;
      const imageUrl = await Cloudinary.uploadToCloudinary(image, path);

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
      const mainFolder = this.getMainFolder();
      const subFolder = field;
      const path = `${mainFolder}/${subFolder}/${fileName}`;
      return this.uploadToCloudinary(file, path);
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
