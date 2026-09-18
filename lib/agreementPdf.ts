/**
 * Rental Agreement PDF Text Extractor — Rental Intelligence Platform
 * ARCHITECTURE.md §2 & §9 | PRODUCT.md §6.5
 * 
 * In-memory PDF text extraction using pdf-parse.
 * No external storage services or persistence is introduced.
 */

export interface PDFExtractionResult {
  text: string;
  totalPages?: number;
}

/**
 * Extracts plain text from a rental agreement PDF buffer.
 * Fails visibly on corrupt, malformed, or unreadable inputs.
 */
export async function extractTextFromPDF(
  buffer: Buffer | Uint8Array
): Promise<string> {
  if (!buffer || buffer.length === 0) {
    throw new Error('PDF extraction failed: input buffer is empty or missing');
  }

  let parser: any = null;
  try {
    const { PDFParse } = await import('pdf-parse');
    parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();

    const rawText = textResult?.text?.trim() || '';

    if (!rawText) {
      throw new Error('PDF extraction failed: document contains no readable text');
    }

    return rawText;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // If it's already our formatted error message, rethrow
    if (message.startsWith('PDF extraction failed:')) {
      throw error;
    }
    throw new Error(`PDF extraction failed: ${message}`);
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch {
        // Safe cleanup
      }
    }
  }
}
