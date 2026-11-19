import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import process from "node:process";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a memory buffer stream to Cloudinary
 * @param {Buffer} buffer - File buffer from multer
 * @param {Object} options - Custom Cloudinary options
 * @returns {Promise<Object>}
 */
export function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: "bookmyshow",
      resource_type: "auto",
      quality: "auto",
      fetch_format: "auto",
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

/**
 * Upload a Base64 string or Data URI to Cloudinary
 * @param {string} dataUri - Base64 Data URI string
 * @param {Object} options - Custom Cloudinary options
 * @returns {Promise<Object>}
 */
export async function uploadBase64ToCloudinary(dataUri, options = {}) {
  const uploadOptions = {
    folder: "bookmyshow",
    resource_type: "auto",
    quality: "auto",
    fetch_format: "auto",
    ...options,
  };

  return await cloudinary.uploader.upload(dataUri, uploadOptions);
}

export default cloudinary;
