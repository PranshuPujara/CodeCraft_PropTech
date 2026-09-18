import { describe, it, expect } from 'vitest';
import { extractTextFromPDF } from '../../lib/agreementPdf';

function createMinimalPdf(text: string): Buffer {
  const contentStream = `BT /F1 12 Tf 20 700 Td (${text}) Tj ET`;
  const streamLength = Buffer.byteLength(contentStream);

  const objects = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj`,
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj`,
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`,
  ];

  let offset = 9; // "%PDF-1.4\n"
  const xrefEntries = ['0000000000 65535 f \n'];
  let body = '%PDF-1.4\n';

  for (const obj of objects) {
    xrefEntries.push(`${String(offset).padStart(10, '0')} 00000 n \n`);
    body += obj + '\n';
    offset = Buffer.byteLength(body);
  }

  const xrefOffset = offset;
  const xref = `xref\n0 ${objects.length + 1}\n` + xrefEntries.join('');
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(body + xref + trailer);
}

describe('PDF Text Extraction (lib/agreementPdf)', () => {
  it('extracts usable text from a valid demo rental agreement PDF', async () => {
    const agreementSnippet = 'Rental Agreement: Monthly rent INR 30000 with 11 months lease duration';
    const pdfBuffer = createMinimalPdf(agreementSnippet);

    const extracted = await extractTextFromPDF(pdfBuffer);
    expect(extracted).toBeDefined();
    expect(extracted).toContain('Rental Agreement');
    expect(extracted).toContain('Monthly rent INR 30000');
  });

  it('fails visibly when input buffer is empty', async () => {
    const emptyBuffer = Buffer.alloc(0);
    await expect(extractTextFromPDF(emptyBuffer)).rejects.toThrow(
      /input buffer is empty or missing/i
    );
  });

  it('fails visibly on malformed or corrupt PDF input', async () => {
    const corruptBuffer = Buffer.from('NOT_A_REAL_PDF_DATA_GARBAGE');
    await expect(extractTextFromPDF(corruptBuffer)).rejects.toThrow(
      /PDF extraction failed/i
    );
  });
});
