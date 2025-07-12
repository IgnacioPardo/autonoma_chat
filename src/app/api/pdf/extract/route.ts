import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

// Configure worker for different environments
if (typeof window === 'undefined') {
  // Server-side: use CDN worker (safer for server environment)
  try {
    // Use CDN worker for server-side as well
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
  } catch {
    // If CDN fails, fallback to another CDN
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  }
} else {
  // Client-side: use CDN worker
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
}

export async function POST(request: NextRequest) {
  try {
    console.log('PDF extract endpoint called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('No file provided in request');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('Processing PDF file:', file.name, file.type, file.size);

    if (file.type !== 'application/pdf') {
      console.error('Invalid file type:', file.type);
      return NextResponse.json(
        { error: `File must be a PDF, received: ${file.type}` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    console.log('File converted to array buffer, size:', uint8Array.length);

    // Extract text from PDF using pdfjs
    const loadingTask = pdfjs.getDocument({
      data: uint8Array,
      verbosity: 0, // Suppress console output
    });
    
    const pdf = await loadingTask.promise;
    console.log('PDF loaded successfully, pages:', pdf.numPages);
    
    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item) => {
          // Type guard to check if item has str property
          if ('str' in item) {
            return (item as { str: string }).str;
          }
          return '';
        })
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    console.log('Text extraction completed, length:', fullText.length);
    
    return NextResponse.json({
      text: fullText.trim(),
      info: {
        pages: pdf.numPages,
      }
    });
  } catch (error) {
    console.error('PDF processing error:', error);
    
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    return NextResponse.json(
      { 
        error: 'Failed to process PDF',
        details: errorMessage,
        stack: errorStack
      },
      { status: 500 }
    );
  }
}
