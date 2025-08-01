import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ 
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function uploadImage(file) {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: 'products',
      resource_type: 'auto'
    });
    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

export default cloudinary;