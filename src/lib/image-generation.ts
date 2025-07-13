import OpenAI from 'openai';

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
  prompt?: string;
  revisedPrompt?: string;
  error?: string;
}

export async function generateImage({
  prompt,
  size = '1024x1024',
  quality = 'standard'
}: ImageGenerationParams): Promise<ImageGenerationResult> {
  try {
    if (!prompt) {
      return {
        success: false,
        error: 'Prompt is required'
      };
    }

    console.log('Generating image with prompt:', prompt);

    // Use OpenAI directly for image generation
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      size,
      quality,
      response_format: 'b64_json',
      n: 1,
    });

    if (!response.data?.[0]?.b64_json) {
      throw new Error('No image data returned');
    }

    // Convert to data URL
    const base64Image = response.data[0].b64_json;
    const dataUrl = `data:image/png;base64,${base64Image}`;

    return {
      success: true,
      imageUrl: dataUrl,
      prompt,
      revisedPrompt: response.data[0].revised_prompt,
    };

  } catch (error) {
    console.error('Error generating image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate image'
    };
  }
}
