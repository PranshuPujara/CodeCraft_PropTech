import { describe, it, expect, vi } from 'vitest';
import { POST } from '../../app/api/agreements/route';
import * as aiClient from '../../lib/ai/client';

// Mock the AI client to prevent real Groq API calls
vi.mock('../../lib/ai/client', () => ({
  completeStructuredJSON: vi.fn(),
}));

describe('POST /api/agreements - Integration', () => {
  it('should process a PDF and successfully return validated JSON from mocked AI response', async () => {
    // 1. Mock the first AI call (Extraction)
    vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce({
      rent: { value: 20000, found: true },
      deposit: { value: 40000, found: true },
      leaseDuration: { value: '11 months', found: true },
      lockInPeriod: { value: '6 months', found: true },
      noticePeriod: { value: '2 months', found: true },
      rentEscalation: { value: '5%', found: true },
      maintenanceResponsibility: { value: 'Tenant', found: true },
      utilityResponsibility: { value: 'Tenant', found: true },
      penalties: { value: 'Late fee', found: true },
      terminationConditions: { value: 'Written notice', found: true },
      summary: 'A standard lease agreement.',
    });

    // 2. Mock the second AI call (Flags)
    vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce({
      flaggedClauses: [
        { clause: 'Lock-in', reason: '6 months is long', attentionLevel: 'medium' }
      ],
      disclaimer: 'Informational only',
    });

    // 3. Create a minimal mock PDF to pass the extractTextFromPDF check
    const contentStream = `BT /F1 12 Tf 20 700 Td (Mock PDF Text) Tj ET`;
    const streamLength = Buffer.byteLength(contentStream);
    const mockPdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${contentStream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000223 00000 n 
0000000287 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
375
%%EOF`;

    const blob = new Blob([Buffer.from(mockPdfContent)], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', blob, 'test.pdf');

    const request = new Request('http://localhost:3000/api/agreements', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    
    expect(response.status).toBe(200);
    const json = await response.json();
    
    // Check that it was persisted and validated
    expect(json.id).toBeDefined();
    expect(json.userId).toBe('demo-user-1');
    expect(json.fileName).toBe('test.pdf');
    expect(JSON.parse(json.extractedFields).rent.value).toBe(20000);
    expect(json.summary).toBe('A standard lease agreement.');
    expect(JSON.parse(json.flaggedClauses)[0].clause).toBe('Lock-in');
  });

  it('should return 400 if no file is provided', async () => {
    const formData = new FormData(); // Empty
    const request = new Request('http://localhost:3000/api/agreements', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
  
  it('should return 400 if file is not a PDF', async () => {
    const blob = new Blob(['Plain text file'], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob, 'test.txt');

    const request = new Request('http://localhost:3000/api/agreements', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain('Invalid file format');
  });

  it('should return 400 if file exceeds 5MB size limit', async () => {
    // We can simulate this by setting the blob size via a large array
    // However, it's easier to just mock a Blob subclass with a fake size property for testing
    // In node/jsdom, we can just create a buffer of 5.1 MB
    const largeBuffer = Buffer.alloc((5 * 1024 * 1024) + 10);
    const blob = new Blob([largeBuffer], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', blob, 'large.pdf');

    const request = new Request('http://localhost:3000/api/agreements', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain('File size exceeds');
  });
});
