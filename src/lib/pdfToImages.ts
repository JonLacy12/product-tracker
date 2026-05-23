import * as pdfjsLib from 'pdfjs-dist';
// Bundle the worker so it resolves inside the Capacitor WebView (no external fetch needed)
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

/**
 * Render every page of a PDF file to a canvas and return base64 JPEG strings
 * with no "data:..." prefix — matching what fileToBase64() in extractor.ts produces.
 */
export async function pdfToImages(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 }); // 1.5× balances OCR quality and payload size

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    // toDataURL returns "data:image/jpeg;base64,<data>" — strip the prefix
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    images.push(dataUrl.split(',')[1]);
  }

  return images;
}
