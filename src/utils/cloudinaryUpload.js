import axios from "axios";

/**
 * Upload an Image File to Cloudinary via backend /api/upload
 * @param {File|Blob} file - The file object to upload
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<string>} The secure Cloudinary CDN URL
 */
export async function uploadImageToCloudinary(file, folder = "bookmyshow/uploads") {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("folder", folder);

  const endpoints = [
    "http://localhost:5000/api/upload",
    "/api/upload",
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 15000,
      });

      if (response.data && response.data.url) {
        return response.data.url;
      }
    } catch (err) {
      lastError = err;
      // If we got a real 4xx/5xx response with a specific message from backend, inspect it
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
    }
  }

  throw lastError || new Error("Failed to upload image to server.");
}

/**
 * Upload a Base64 data URI to Cloudinary via backend /api/upload
 * @param {string} base64Data - Base64 Data URI string
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<string>} The secure Cloudinary CDN URL
 */
export async function uploadBase64ToCloudinaryApi(base64Data, folder = "bookmyshow/uploads") {
  const endpoints = [
    "http://localhost:5000/api/upload",
    "/api/upload",
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await axios.post(
        endpoint,
        { image: base64Data, folder },
        { timeout: 15000 }
      );

      if (response.data && response.data.url) {
        return response.data.url;
      }
    } catch (err) {
      lastError = err;
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
    }
  }

  throw lastError || new Error("Failed to upload base64 image to server.");
}
