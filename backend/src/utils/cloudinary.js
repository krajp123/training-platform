import { v2 as cloudinary } from 'cloudinary';

const imageSignatures = {
  'image/jpeg': (data) => data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff,
  'image/png': (data) => data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (data) => data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP',
};

function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    const error = new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
    error.statusCode = 503;
    throw error;
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export function validateImageFile(file, maxSize, label) {
  if (!file || file.size > maxSize || !imageSignatures[file.mimetype]?.(file.buffer)) {
    const error = new Error(`${label} must be a JPEG, PNG, or WebP image smaller than ${Math.floor(maxSize / (1024 * 1024))} MB.`);
    error.statusCode = 400;
    throw error;
  }
}

export function uploadImage(file, folder) {
  const client = configureCloudinary();
  return new Promise((resolve, reject) => {
    const upload = client.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url || !result.public_id) return reject(new Error('Cloudinary returned an incomplete upload result.'));
        return resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    upload.end(file.buffer);
  });
}

export async function deleteCloudinaryImage(publicId) {
  const result = await configureCloudinary().uploader.destroy(publicId, { resource_type: 'image' });
  if (!['ok', 'not found'].includes(result.result)) {
    throw new Error(`Cloudinary could not delete image "${publicId}".`);
  }
}
