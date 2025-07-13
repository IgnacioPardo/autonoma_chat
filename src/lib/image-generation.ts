import OpenAI from 'openai';
import { uploadImageToCloudinary } from './cloudinary';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ImageGenerationParams {
  prompt: string;
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  cloudinaryPublicId?: string;
  prompt?: string;
  revisedPrompt?: string;
  error?: string;
}

export async function generateImage({
  prompt,
  size = '1024x1024',
  quality = 'standard'
}: ImageGenerationParams): Promise<ImageGenerationResult> {
  const totalStartTime = Date.now();
  
  try {
    if (!prompt) {
      return {
        success: false,
        error: 'Prompt is required'
      };
    }

    console.log('🎨 Generating image with prompt:', prompt);
    console.log('📐 Image parameters:', { size, quality });

    // Use OpenAI directly for image generation
    console.log('🤖 Calling OpenAI DALL-E 3...');
    const startTime = Date.now();
    
    const response = await Promise.race([
      openai.images.generate({
        model: 'dall-e-3',
        prompt,
        size,
        quality,
        response_format: 'b64_json',
        n: 1,
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('DALL-E request timeout after 45 seconds')), 45000)
      )
    ]);

    const dalleTime = Date.now() - startTime;
    console.log(`✅ DALL-E response received in ${dalleTime}ms`);

    if (!response.data?.[0]?.b64_json) {
      throw new Error('No image data returned');
    }

    // Get the base64 image data
    const base64Image = response.data[0].b64_json;
    console.log(`📦 Base64 image size: ${Math.round(base64Image.length / 1024)}KB`);
    
    // Upload to Cloudinary instead of returning base64
    console.log('☁️ Starting Cloudinary upload...');
    const uploadStartTime = Date.now();
    
    const uploadResult = await Promise.race([
      uploadImageToCloudinary(
        base64Image,
        prompt.substring(0, 50).replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase()
      ),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Cloudinary upload timeout after 45 seconds')), 45000)
      )
    ]);

    const uploadTime = Date.now() - uploadStartTime;
    console.log(`📤 Cloudinary upload completed in ${uploadTime}ms`);

    if (!uploadResult.success) {
      console.error('❌ Failed to upload to Cloudinary:', uploadResult.error);
      return {
        success: false,
        error: `Failed to upload image: ${uploadResult.error}`
      };
    }

    console.log('✅ Image uploaded to Cloudinary:', uploadResult.url);
    console.log(`🏁 Total image generation time: ${Date.now() - totalStartTime}ms`);

    return {
      success: true,
      imageUrl: uploadResult.url!,
      cloudinaryPublicId: uploadResult.public_id,
      prompt,
      revisedPrompt: response.data[0].revised_prompt,
    };

  } catch (error) {
    console.error('💥 Error generating image:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate image'
    };
  }
}
