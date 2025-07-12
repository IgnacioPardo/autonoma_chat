import OpenAI from 'openai';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { 
      prompt?: string; 
      size?: string; 
      quality?: string; 
    };
    const { prompt, size = '1024x1024', quality = 'standard' } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('Generating image with prompt:', prompt);

    // Use OpenAI directly for image generation
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      size: size as '1024x1024' | '1024x1792' | '1792x1024',
      quality: quality as 'standard' | 'hd',
      response_format: 'b64_json',
      n: 1,
    });

    if (!response.data?.[0]?.b64_json) {
      throw new Error('No image data returned');
    }

    // Convert to data URL
    const base64Image = response.data[0].b64_json;
    const dataUrl = `data:image/png;base64,${base64Image}`;

    return NextResponse.json({
      success: true,
      imageUrl: dataUrl,
      prompt,
      revisedPrompt: response.data[0].revised_prompt,
    });

  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
