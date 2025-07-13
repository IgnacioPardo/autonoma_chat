import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  public_id?: string;
  error?: string;
}

// Interface for Cloudinary upload response
interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

// Interface for Cloudinary destroy response  
interface CloudinaryDestroyResponse {
  result: string;
}

/**
 * Upload a base64 image to Cloudinary
 */
export async function uploadImageToCloudinary(
  base64Data: string,
  filename?: string
): Promise<CloudinaryUploadResult> {
  try {
    // Add data:image/png;base64, prefix if not present
    const dataUrl = base64Data.startsWith('data:') 
      ? base64Data 
      : `data:image/png;base64,${base64Data}`;

    const uploadResult = await cloudinary.uploader.upload(dataUrl, {
      folder: 'autonoma-chat/generated-images',
      public_id: filename ? `generated-${filename}-${Date.now()}` : undefined,
      resource_type: 'image',
      format: 'png',
      quality: 'auto:good',
    }) as CloudinaryUploadResponse;

    return {
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    };
  }
}

/**
 * Upload a file buffer to Cloudinary
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  filename?: string,
  contentType = 'image/png'
): Promise<CloudinaryUploadResult> {
  try {
    const base64Data = `data:${contentType};base64,${buffer.toString('base64')}`;
    return await uploadImageToCloudinary(base64Data, filename);
  } catch (error) {
    console.error('Error uploading buffer to Cloudinary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload buffer',
    };
  }
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImageFromCloudinary(
  publicId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await cloudinary.uploader.destroy(publicId) as CloudinaryDestroyResponse;
    return {
      success: result.result === 'ok',
      error: result.result !== 'ok' ? 'Failed to delete image' : undefined,
    };
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete image',
    };
  }
}

export default cloudinary;
